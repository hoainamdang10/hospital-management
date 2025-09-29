/**
 * Create User Command Handler - CQRS Pattern
 * Application Layer - Command Handler
 */

import { CommandHandler } from '../../../shared/application/CommandHandler';
import { CreateUserCommand } from '../commands/CreateUserCommand';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/aggregates/User';
import { Email } from '../../domain/value-objects/Email';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { HealthcareRole } from '../../domain/entities/HealthcareRole';
import { IPasswordHashingService } from '../services/IPasswordHashingService';
import { IEventBus } from '../../../shared/application/IEventBus';
import { UserId } from '../../domain/value-objects/UserId';

export interface CreateUserResult {
  userId: string;
  email: string;
  fullName: string;
  roleName: string;
  isActive: boolean;
}

export class CreateUserCommandHandler implements CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashingService: IPasswordHashingService,
    private readonly eventBus: IEventBus
  ) {}

  public async handle(command: CreateUserCommand): Promise<CreateUserResult> {
    // Validate command
    command.validate();

    // Create value objects
    const email = Email.create(command.email);
    const personalInfo = PersonalInfo.create({
      fullName: command.fullName,
      phoneNumber: command.phoneNumber,
      dateOfBirth: command.dateOfBirth,
      gender: command.gender,
      address: command.address,
      nationalId: command.nationalId,
      emergencyContact: command.emergencyContact
    });

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    // Check if national ID already exists (if provided)
    if (command.nationalId) {
      const existingUserByNationalId = await this.userRepository.findByNationalId(command.nationalId);
      if (existingUserByNationalId) {
        throw new Error('Số CMND/CCCD đã được sử dụng');
      }
    }

    // Create healthcare role
    const healthcareRole = this.createHealthcareRole(command.roleName);

    // Hash password
    const passwordHash = await this.passwordHashingService.hash(command.password);

    // Create user aggregate
    const user = User.create(email, personalInfo, passwordHash, healthcareRole);

    // Save user
    await this.userRepository.save(user);

    // Publish domain events
    await this.eventBus.publishAll(user.getDomainEvents());

    // Clear domain events
    user.clearDomainEvents();

    return {
      userId: user.id.value,
      email: user.email.value,
      fullName: user.personalInfo.fullName,
      roleName: user.healthcareRole.name,
      isActive: user.isActive
    };
  }

  private createHealthcareRole(roleName: string): HealthcareRole {
    switch (roleName) {
      case 'admin':
        return HealthcareRole.createAdmin();
      case 'doctor':
        return HealthcareRole.createDoctor();
      case 'nurse':
        return HealthcareRole.createNurse();
      case 'receptionist':
        return HealthcareRole.createReceptionist();
      case 'patient':
        return HealthcareRole.createPatient();
      default:
        throw new Error(`Vai trò không được hỗ trợ: ${roleName}`);
    }
  }
}
