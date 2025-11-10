import { ValueObject } from '@shared/domain/base/value-object';

export interface InsuranceProps {
  provider: string;
  policyNumber: string;
  coveragePercentage: number;
}

export class Insurance extends ValueObject<InsuranceProps> {
  private constructor(props: InsuranceProps) {
    super(props);
  }

  public static create(provider: string, policyNumber: string, coveragePercentage: number): Insurance {
    if (coveragePercentage < 0 || coveragePercentage > 100) {
      throw new Error('Coverage percentage must be between 0 and 100');
    }
    return new Insurance({ provider, policyNumber, coveragePercentage });
  }

  get provider(): string {
    return this.props.provider;
  }

  get policyNumber(): string {
    return this.props.policyNumber;
  }

  get coveragePercentage(): number {
    return this.props.coveragePercentage;
  }

  protected validateFormat(): void {
    if (!this.props.provider || this.props.provider.trim().length === 0) {
      throw new Error('Insurance provider cannot be empty');
    }
    if (!this.props.policyNumber || this.props.policyNumber.trim().length === 0) {
      throw new Error('Policy number cannot be empty');
    }
    if (this.props.coveragePercentage < 0 || this.props.coveragePercentage > 100) {
      throw new Error('Coverage percentage must be between 0 and 100');
    }
  }
}
