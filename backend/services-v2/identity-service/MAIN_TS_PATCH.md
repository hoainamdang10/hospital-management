# MAIN.TS UPDATE PATCH
# Add these imports and code to main.ts

## 1. ADD IMPORTS (after line 24)

import { SupabaseAuthService } from './infrastructure/auth/SupabaseAuthService';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';
import { ForgotPasswordUseCase } from './application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from './application/use-cases/ResetPasswordUseCase';
import { VerifyEmailUseCase } from './application/use-cases/VerifyEmailUseCase';
import { LogoutUserUseCase } from './application/use-cases/LogoutUserUseCase';

## 2. ADD PROPERTIES TO CLASS (after line 58)

private authService: SupabaseAuthService;
private registerUserUseCase: RegisterUserUseCase;
private forgotPasswordUseCase: ForgotPasswordUseCase;
private resetPasswordUseCase: ResetPasswordUseCase;
private verifyEmailUseCase: VerifyEmailUseCase;
private logoutUserUseCase: LogoutUserUseCase;

## 3. INITIALIZE IN initializeInfrastructure() (after line 96)

// Initialize Supabase Auth Service
this.authService = new SupabaseAuthService(
  config.supabaseUrl,
  config.supabaseKey,
  logger
);

// Initialize new use cases
this.registerUserUseCase = new RegisterUserUseCase(
  this.authService,
  this.userRepository,
  logger
);

this.forgotPasswordUseCase = new ForgotPasswordUseCase(
  this.authService,
  this.userRepository,
  logger
);

this.resetPasswordUseCase = new ResetPasswordUseCase(
  this.authService,
  logger
);

this.verifyEmailUseCase = new VerifyEmailUseCase(
  this.authService,
  this.userRepository,
  logger
);

this.logoutUserUseCase = new LogoutUserUseCase(
  this.authService,
  this.userRepository,
  logger
);

## 4. ADD NEW ENDPOINTS (after line 245, before logout endpoint)

// User Registration endpoint
this.app.post('/auth/register', async (req, res) => {
  try {
    const request = {
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      roleType: req.body.roleType,
      phoneNumber: req.body.phoneNumber,
      citizenId: req.body.citizenId,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      address: req.body.address
    };

    const result = await this.registerUserUseCase.execute(request);
    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Registration endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống, vui lòng thử lại sau'
    });
  }
});

// Forgot Password endpoint
this.app.post('/auth/forgot-password', async (req, res) => {
  try {
    const request = {
      email: req.body.email
    };

    const result = await this.forgotPasswordUseCase.execute(request);
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Forgot password endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống, vui lòng thử lại sau'
    });
  }
});

// Reset Password endpoint
this.app.post('/auth/reset-password', async (req, res) => {
  try {
    const request = {
      accessToken: req.body.accessToken,
      newPassword: req.body.newPassword,
      confirmPassword: req.body.confirmPassword
    };

    const result = await this.resetPasswordUseCase.execute(request);
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Reset password endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống, vui lòng thử lại sau'
    });
  }
});

// Verify Email endpoint
this.app.post('/auth/verify-email', async (req, res) => {
  try {
    const request = {
      email: req.body.email,
      token: req.body.token
    };

    const result = await this.verifyEmailUseCase.execute(request);
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Verify email endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống, vui lòng thử lại sau'
    });
  }
});
