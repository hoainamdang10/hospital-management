const fs = require('fs');
const path = require('path');

const eventsDir = path.join(__dirname, 'src', 'domain', 'events');

// Files that need constructor fixes
const constructorFixFiles = [
  'ClinicalNoteUpdatedEvent.ts',
  'TreatmentPlanCreatedEvent.ts',
  'TreatmentPlanUpdatedEvent.ts',
  'TreatmentPlanCompletedEvent.ts',
  'DiagnosticReportUpdatedEvent.ts',
  'DiagnosticReportFinalizedEvent.ts',
  'PrescriptionUpdatedEvent.ts',
  'PrescriptionDispensedEvent.ts',
  'PrescriptionCompletedEvent.ts'
];

const files = [
  'ClinicalNoteUpdatedEvent.ts',
  'TreatmentPlanCreatedEvent.ts',
  'TreatmentPlanUpdatedEvent.ts',
  'TreatmentPlanCompletedEvent.ts',
  'DiagnosticReportUpdatedEvent.ts',
  'DiagnosticReportFinalizedEvent.ts',
  'PrescriptionUpdatedEvent.ts',
  'PrescriptionDispensedEvent.ts',
  'PrescriptionCompletedEvent.ts',
  'MedicalRecordCreatedEvent.ts',
  'MedicalRecordUpdatedEvent.ts',
  'MedicalRecordArchivedEvent.ts',
  'DiagnosisAddedEvent.ts',
  'MedicationAddedEvent.ts',
  'VitalSignsUpdatedEvent.ts'
];

// Fix constructors first
constructorFixFiles.forEach(fileName => {
  const filePath = path.join(eventsDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`️  File not found: ${fileName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if constructor needs fixing (using object pattern in super call)
  if (content.includes('super({')) {
    console.log(` Fixing constructor: ${fileName}`);
    
    // Extract event type from super call
    const eventTypeMatch = content.match(/eventType:\s*'([^']+)'/);
    const aggregateTypeMatch = content.match(/aggregateType:\s*'([^']+)'/);
    
    if (eventTypeMatch && aggregateTypeMatch) {
      const eventType = eventTypeMatch[1];
      const aggregateType = aggregateTypeMatch[1];
      
      // Replace old constructor pattern with new pattern
      content = content.replace(
        /super\(\{[^}]+eventType:\s*'[^']+',\s*aggregateId:[^,]+,\s*aggregateType:\s*'[^']+',\s*payload,\s*eventVersion[^}]*\}\);/s,
        `super(
      '${eventType}',
      aggregateId || payload.${getIdFieldFromFilename(fileName)},
      '${aggregateType}',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId
    );`
      );
      
      // Add missing parameters if not present
      if (!content.includes('correlationId?: string')) {
        content = content.replace(
          /constructor\([^)]+\)/s,
          (match) => {
            if (!match.includes('correlationId')) {
              return match.replace(/\)/, ',\n    correlationId?: string,\n    causationId?: string,\n    userId?: string\n  )');
            }
            return match;
          }
        );
      }
      
      // Add private readonly payload field if not present
      if (!content.includes('private readonly payload')) {
        content = content.replace(
          /export class \w+ extends DomainEvent \{/,
          (match) => match + '\n  private readonly payload: any;'
        );
        
        // Add payload assignment
        content = content.replace(
          /super\([^)]+\);/s,
          (match) => match + '\n    this.payload = payload;'
        );
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(` Fixed constructor: ${fileName}`);
    }
  }
});

function getIdFieldFromFilename(fileName) {
  if (fileName.includes('ClinicalNote')) return 'noteId';
  if (fileName.includes('TreatmentPlan')) return 'treatmentPlanId';
  if (fileName.includes('DiagnosticReport')) return 'reportId';
  if (fileName.includes('Prescription')) return 'prescriptionId';
  return 'id';
}

// Then add missing methods
files.forEach(fileName => {
  const filePath = path.join(eventsDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`️  File not found: ${fileName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already fixed
  if (content.includes('public getEventData()') && content.includes('public containsPHI()') && content.includes('public getPatientId()')) {
    console.log(` Already has methods: ${fileName}`);
    return;
  }

  console.log(` Adding methods: ${fileName}`);
  
  // Add required methods before last closing brace
  const lastBraceIndex = content.lastIndexOf('}');
  
  if (lastBraceIndex === -1) {
    console.log(` Cannot find closing brace in ${fileName}`);
    return;
  }

  const methodsToAdd = `
  public getEventData(): any {
    return this.payload || {
      ...Object.keys(this).reduce((acc, key) => {
        if (!key.startsWith('event') && key !== 'metadata' && key !== 'payload') {
          acc[key] = this[key];
        }
        return acc;
      }, {})
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId || this.payload?.patientId || null;
  }
`;

  content = content.slice(0, lastBraceIndex) + methodsToAdd + '\n' + content.slice(lastBraceIndex);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(` Added methods: ${fileName}`);
});

console.log('\n All event files have been processed!');
