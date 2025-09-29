/**
 * Create User Command - CQRS Pattern
 * Application Layer - Command Side
 */

import { Command } from '../../../shared/application/Command';

export interface CreateUserCommandProps {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  nationalId?: string;
  emergencyContact?: string;
  roleName: string;
}

export class CreateUserCommand extends Command {
  public readonly email: string;
  public readonly password: string;
  public readonly fullName: string;
  public readonly phoneNumber: string;
  public readonly dateOfBirth?: Date;
  public readonly gender?: 'male' | 'female' | 'other';
  public readonly address?: string;
  public readonly nationalId?: string;
  public readonly emergencyContact?: string;
  public readonly roleName: string;

  constructor(props: CreateUserCommandProps) {
    super();
    this.email = props.email;
    this.password = props.password;
    this.fullName = props.fullName;
    this.phoneNumber = props.phoneNumber;
    this.dateOfBirth = props.dateOfBirth;
    this.gender = props.gender;
    this.address = props.address;
    this.nationalId = props.nationalId;
    this.emergencyContact = props.emergencyContact;
    this.roleName = props.roleName;
  }

  public validate(): void {
    const errors: string[] = [];

    if (!this.email || this.email.trim().length === 0) {
      errors.push('Email không được để trống');
    }

    if (!this.password || this.password.length < 8) {
      errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (!this.fullName || this.fullName.trim().length === 0) {
      errors.push('Họ và tên không được để trống');
    }

    if (!this.phoneNumber || this.phoneNumber.trim().length === 0) {
      errors.push('Số điện thoại không được để trống');
    }

    if (!this.roleName || this.roleName.trim().length === 0) {
      errors.push('Vai trò không được để trống');
    }

    const validRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'patient'];
    if (!validRoles.includes(this.roleName)) {
      errors.push('Vai trò không hợp lệ');
    }

    if (errors.length > 0) {
      throw new Error(`Dữ liệu không hợp lệ: ${errors.join(', ')}`);
    }
  }
}
