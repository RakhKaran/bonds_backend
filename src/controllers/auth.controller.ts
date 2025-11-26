import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, patch, post, requestBody} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {authorize} from '../authorization';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {CompanyPanCardsRepository, CompanyProfilesRepository, KycApplicationsRepository, OtpRepository, RegistrationSessionsRepository, RolesRepository, UserRolesRepository, UsersRepository} from '../repositories';
import {FileUploadProvider} from '../services/file-upload.service';
import {BcryptHasher} from '../services/hash.password.bcrypt';
import {JWTService} from '../services/jwt-service';
import {RbacService} from '../services/rbac.service';
import {MyUserService} from '../services/user-service';

export class AuthController {
  constructor(
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(RolesRepository)
    private rolesRepository: RolesRepository,
    @repository(UserRolesRepository)
    private userRolesRepository: UserRolesRepository,
    @repository(OtpRepository)
    private otpRepository: OtpRepository,
    @repository(RegistrationSessionsRepository)
    private registrationSessionsRepository: RegistrationSessionsRepository,
    @repository(CompanyProfilesRepository)
    private companyProfilesRepository: CompanyProfilesRepository,
    @repository(CompanyPanCardsRepository)
    private companyPanCardsRepository: CompanyPanCardsRepository,
    @repository(KycApplicationsRepository)
    private kycApplicationsRepository: KycApplicationsRepository,
    @inject('service.hasher')
    private hasher: BcryptHasher,
    @inject('service.user.service')
    public userService: MyUserService,
    @inject('service.jwt.service')
    public jwtService: JWTService,
    @inject('services.rbac')
    public rbacService: RbacService,
    @inject(FILE_UPLOAD_SERVICE)
    private fileUploadProvider: FileUploadProvider
  ) { }

  // ---------------------------------------Super Admin Auth API's------------------------------------
  @post('/auth/super-admin')
  async createSuperAdmin(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'phone', 'password', 'fullName'],
            properties: {
              email: {type: 'string'},
              phone: {type: 'string'},
              password: {type: 'string'},
              fullName: {type: 'string'},
            },
          },
        },
      },
    })
    body: {
      fullName: string;
      email: string;
      phone: string;
      password: string
    },
  ): Promise<{success: boolean; message: string; userId: string}> {
    const superadminRole = await this.rolesRepository.findOne({
      where: {value: 'super_admin'},
    });

    if (!superadminRole) {
      throw new HttpErrors.BadRequest(
        'Superadmin role does not exist in roles table',
      );
    }

    const existingSuperadmin = await this.userRolesRepository.findOne({
      where: {rolesId: superadminRole.id},
    });

    if (existingSuperadmin) {
      throw new HttpErrors.BadRequest('Super Admin already exists');
    }

    const existUser = await this.usersRepository.findOne({
      where: {email: body.email},
    });

    if (existUser) {
      throw new HttpErrors.BadRequest('User already exists with this email');
    }

    const hashedPassword = await this.hasher.hashPassword(body.password);

    const newUser = await this.usersRepository.create({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      password: hashedPassword,
      isActive: true,
    });

    await this.userRolesRepository.create({
      usersId: newUser.id!,
      rolesId: superadminRole.id!,
    });

    return {
      success: true,
      message: 'Super Admin created successfully',
      userId: newUser.id,
    };
  }

  @post('/auth/super-admin-login')
  async superAdminLogin(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {type: 'string'},
              password: {type: 'string'}
            }
          }
        }
      }
    })
    body: {email: string; password: string;}
  ): Promise<{success: boolean; message: string; accessToken: string; user: object}> {
    const userData = await this.usersRepository.findOne({
      where: {
        and: [
          {email: body.email},
          {isDeleted: false}
        ]
      }
    });

    if (!userData) {
      throw new HttpErrors.BadRequest('User not exist');
    }

    const user = await this.userService.verifyCredentials(body);

    const {roles, permissions} = await this.rbacService.getUserRoleAndPermissionsByRole(user.id!, 'super_admin');

    if (!roles.includes('super_admin')) {
      throw new HttpErrors.Forbidden('Access denied. Only super_admin can login here.');
    }

    const userProfile: UserProfile & {
      roles: string[];
      permissions: string[];
      phone: string;
    } = {
      [securityId]: user.id!,
      id: user.id!,
      email: user.email,
      phone: user.phone,
      roles,
      permissions,
    };

    const token = await this.jwtService.generateToken(userProfile);
    const profile = await this.rbacService.returnSuperAdminProfile(user.id, roles, permissions);
    return {
      success: true,
      message: "Super Admin login successful",
      accessToken: token,
      user: profile
    };
  }

  // --------------------------------------------Comman Auth API's----------------------------------
  @authenticate('jwt')
  @authorize({roles: ['super_admin', 'company', 'trustee']})
  @post('/auth/update-password')
  async updatePassword(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['oldPassword', 'newPassword'],
            properties: {
              oldPassword: {type: 'string'},
              newPassword: {type: 'string'}
            }
          }
        }
      }
    })
    body: {
      oldPassword: string;
      newPassword: string;
    }
  ): Promise<{success: boolean; message: string}> {
    const user = await this.usersRepository.findById(currentUser.id);

    if (!user) {
      throw new HttpErrors.NotFound('No user found with given credentials');
    }

    const oldHashedPassword = user.password;
    const isValidPassword = await this.hasher.comparePassword(body.oldPassword, oldHashedPassword!);

    if (!isValidPassword) {
      throw new HttpErrors.BadRequest('Invalid old password');
    }

    const hashedPassword = await this.hasher.hashPassword(body.newPassword);

    await this.usersRepository.updateById(user.id, {password: hashedPassword});

    return {
      success: true,
      message: "Password updated successfully"
    }
  }

  // -----------------------------------------registration verification Otp's------------------------
  @post('/auth/send-phone-otp')
  async sendPhoneOtp(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['phone', 'role'],
            properties: {
              phone: {type: 'string'},
              role: {type: 'string'}
            }
          }
        }
      }
    })
    body: {
      phone: string;
      role: string;
    }
  ): Promise<{success: boolean; message: string; sessionId: string}> {

    const user = await this.usersRepository.findOne({
      where: {phone: body.phone}
    });

    const role = await this.rolesRepository.findOne({
      where: {value: body.role}
    });

    if (!role) {
      if (process.env.NODE_ENV === 'dev') {
        throw new HttpErrors.BadRequest("Invalid role received");
      }
      throw new HttpErrors.InternalServerError("Something went wrong");
    }

    if (user) {
      const isUserRole = await this.userRolesRepository.findOne({
        where: {usersId: user.id, rolesId: role.id}
      });

      if (isUserRole) {
        throw new HttpErrors.BadRequest(
          `Phone number is already registered as ${role.label}`
        );
      }
    }

    await this.otpRepository.updateAll(
      {isUsed: true, expiresAt: new Date()},
      {identifier: body.phone, type: 0}
    );

    const otp = await this.otpRepository.create({
      otp: '1234',
      type: 0,
      identifier: body.phone,
      attempts: 0,
      isUsed: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min
    });

    if (!otp) {
      throw new HttpErrors.InternalServerError(
        process.env.NODE_ENV === 'dev'
          ? "Failed to create otp"
          : "Something went wrong"
      );
    }

    const session = await this.registrationSessionsRepository.create({
      phoneNumber: body.phone,
      phoneVerified: false,
      emailVerified: false,
      roleValue: body.role,
      isActive: true,
      isDeleted: false,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
    });

    if (!session) {
      throw new HttpErrors.InternalServerError(
        process.env.NODE_ENV === 'dev'
          ? "Failed to create registration session"
          : "Something went wrong"
      );
    }

    return {
      success: true,
      message: "OTP sent successfully",
      sessionId: session.id,
    };
  }

  @post('/auth/verify-phone-otp')
  async verifyPhoneOtp(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['sessionId', 'otp'],
            properties: {
              sessionId: {type: 'string'},
              otp: {type: 'string'},
            },
          },
        },
      },
    })
    body: {sessionId: string; otp: string},
  ): Promise<{success: boolean; message: string}> {
    const {sessionId, otp} = body;

    const session = await this.registrationSessionsRepository.findById(
      sessionId,
    );

    if (!session) {
      throw new HttpErrors.BadRequest('Invalid session');
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new HttpErrors.BadRequest('Session expired, please restart signup');
    }

    if (!session.phoneNumber) {
      throw new HttpErrors.BadRequest('Phone number missing in session');
    }

    const otpEntry = await this.otpRepository.findOne({
      where: {
        identifier: session.phoneNumber,
        type: 0,
        isUsed: false,
      },
      order: ['createdAt DESC'],
    });

    if (!otpEntry) {
      throw new HttpErrors.BadRequest('OTP expired or not found');
    }

    if (otpEntry.attempts >= 3) {
      throw new HttpErrors.BadRequest(
        'Maximum attempts reached, please request a new OTP',
      );
    }

    if (new Date(otpEntry.expiresAt) < new Date()) {
      await this.otpRepository.updateById(otpEntry.id, {
        isUsed: true,
        expiresAt: new Date(),
      });

      throw new HttpErrors.BadRequest('OTP expired, request a new one');
    }

    if (otpEntry.otp !== otp) {
      await this.otpRepository.updateById(otpEntry.id, {
        attempts: otpEntry.attempts + 1,
      });

      throw new HttpErrors.BadRequest('Invalid OTP');
    }

    await this.otpRepository.updateById(otpEntry.id, {
      isUsed: true,
      expiresAt: new Date(),
    });

    await this.registrationSessionsRepository.updateById(sessionId, {
      phoneVerified: true,
    });

    return {
      success: true,
      message: 'Phone number verified successfully',
    };
  }

  @post('/auth/send-email-otp')
  async sendEmailOtp(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['sessionId', 'email'],
            properties: {
              sessionId: {type: 'string'},
              email: {type: 'string'},
            }
          }
        }
      }
    })
    body: {
      sessionId: string;
      email: string;
    }
  ): Promise<{success: boolean; message: string}> {

    const session = await this.registrationSessionsRepository.findById(
      body.sessionId,
    );

    if (!session) {
      throw new HttpErrors.BadRequest('Invalid session');
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new HttpErrors.BadRequest('Session expired, please restart signup');
    }

    if (!session.phoneVerified) {
      throw new HttpErrors.BadRequest('Phone number is not verified');
    }

    const user = await this.usersRepository.findOne({
      where: {email: body.email}
    });

    const role = await this.rolesRepository.findOne({
      where: {value: session.roleValue}
    });

    if (!role) {
      if (process.env.NODE_ENV === 'dev') {
        throw new HttpErrors.BadRequest("Invalid role received");
      }
      throw new HttpErrors.InternalServerError("Something went wrong");
    }

    if (user) {
      if (session.phoneNumber !== user.phone) {
        throw new HttpErrors.BadRequest(
          `Email is already registered with another user`
        );
      }

      const isUserRole = await this.userRolesRepository.findOne({
        where: {usersId: user.id, rolesId: role.id}
      });

      if (isUserRole) {
        throw new HttpErrors.BadRequest(
          `Email is already registered as ${role.label}`
        );
      }
    }

    await this.otpRepository.updateAll(
      {isUsed: true, expiresAt: new Date()},
      {identifier: body.email, type: 1}
    );

    const otp = await this.otpRepository.create({
      otp: '4321',
      type: 1,
      identifier: body.email,
      attempts: 0,
      isUsed: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min
    });

    if (!otp) {
      throw new HttpErrors.InternalServerError(
        process.env.NODE_ENV === 'dev'
          ? "Failed to create otp"
          : "Something went wrong"
      );
    }

    await this.registrationSessionsRepository.updateById(body.sessionId, {
      email: body.email,
      emailVerified: false,
    });

    return {
      success: true,
      message: "OTP sent successfully",
    };
  }

  @post('/auth/verify-email-otp')
  async verifyEmailOtp(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['sessionId', 'otp'],
            properties: {
              sessionId: {type: 'string'},
              otp: {type: 'string'},
            },
          },
        },
      },
    })
    body: {sessionId: string; otp: string},
  ): Promise<{success: boolean; message: string}> {
    const {sessionId, otp} = body;

    const session = await this.registrationSessionsRepository.findById(
      sessionId,
    );

    if (!session) {
      throw new HttpErrors.BadRequest('Invalid session');
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new HttpErrors.BadRequest('Session expired, please restart signup');
    }

    if (!session.email) {
      throw new HttpErrors.BadRequest('Email missing in session');
    }

    const otpEntry = await this.otpRepository.findOne({
      where: {
        identifier: session.email,
        type: 1,
        isUsed: false,
      },
      order: ['createdAt DESC'],
    });

    if (!otpEntry) {
      throw new HttpErrors.BadRequest('OTP expired or not found');
    }

    if (otpEntry.attempts >= 3) {
      throw new HttpErrors.BadRequest(
        'Maximum attempts reached, please request a new OTP',
      );
    }

    if (new Date(otpEntry.expiresAt) < new Date()) {
      await this.otpRepository.updateById(otpEntry.id, {
        isUsed: true,
        expiresAt: new Date(),
      });

      throw new HttpErrors.BadRequest('OTP expired, request a new one');
    }

    if (otpEntry.otp !== otp) {
      await this.otpRepository.updateById(otpEntry.id, {
        attempts: otpEntry.attempts + 1,
      });

      throw new HttpErrors.BadRequest('Invalid OTP');
    }

    await this.otpRepository.updateById(otpEntry.id, {
      isUsed: true,
      expiresAt: new Date(),
    });

    await this.registrationSessionsRepository.updateById(sessionId, {
      emailVerified: true,
    });

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  // ------------------------------------------Company Registration API's------------------------------
  @post('/auth/company-registration')
  async companyRegistration(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: [
              'sessionId',
              'password',
              'companyName',
              'CIN',
              'GSTIN',
              'udyamRegistrationNumber',
              'dateOfIncorporation',
              'cityOfIncorporation',
              'stateOfIncorporation',
              'countryOfIncorporation',
              'submittedPanDetails',
              'panCardDocumentId',
              'companyEntityTypeId',
              'companySectorTypeId'
            ],
            properties: {
              sessionId: {
                type: 'string',
                description: 'Registration session id'
              },
              password: {type: 'string'},
              companyName: {type: 'string'},
              CIN: {
                type: 'string',
                pattern: '^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$'
              },
              GSTIN: {
                type: 'string',
                minLength: 15,
                maxLength: 15
              },
              udyamRegistrationNumber: {
                type: 'string'
              },
              dateOfIncorporation: {
                type: 'string',
                pattern: '^\\d{4}-\\d{2}-\\d{2}$'
              },
              cityOfIncorporation: {type: 'string'},
              stateOfIncorporation: {type: 'string'},
              countryOfIncorporation: {type: 'string'},

              humanInteraction: {
                type: 'boolean',
                default: false
              },
              extractedPanDetails: {
                type: 'object',
                required: [],
                properties: {
                  extractedCompanyName: {type: 'string'},
                  extractedPanNumber: {
                    type: 'string',
                    pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
                  },
                  extractedDateOfBirth: {
                    type: 'string',
                    pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                  }
                }
              },
              submittedPanDetails: {
                type: 'object',
                required: ['submittedCompanyName', 'submittedPanNumber', 'submittedDateOfBirth'],
                properties: {
                  submittedCompanyName: {type: 'string'},
                  submittedPanNumber: {
                    type: 'string',
                    pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
                  },
                  submittedDateOfBirth: {
                    type: 'string',
                    pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                  }
                }
              },
              panCardDocumentId: {
                type: 'string',
                description: 'Media ID of uploaded PAN card'
              },
              companySectorTypeId: {type: 'string'},
              companyEntityTypeId: {type: 'string'},
            }
          }
        }
      }
    })
    body: {
      sessionId: string;
      password: string;
      companyName: string;
      CIN: string;
      GSTIN: string;
      udyamRegistrationNumber: string;
      dateOfIncorporation: string; // yyyy-mm-dd
      cityOfIncorporation: string;
      stateOfIncorporation: string;
      countryOfIncorporation: string;
      humanInteraction?: boolean;
      extractedPanDetails?: {
        extractedCompanyName?: string;
        extractedPanNumber?: string;
        extractedDateOfBirth?: string; // yyyy-mm-dd
      };
      submittedPanDetails: {
        submittedCompanyName: string;
        submittedPanNumber: string;
        submittedDateOfBirth: string; // yyyy-mm-dd
      };
      panCardDocumentId: string;
      companySectorTypeId: string;
      companyEntityTypeId: string;
    }
  ): Promise<{success: boolean; message: string; kycStatus: number}> {
    const tx = await this.companyProfilesRepository.dataSource.beginTransaction({
      isolationLevel: 'READ COMMITTED',
    });
    try {
      // ----------------------------
      //  Validate Registration Session
      // ----------------------------
      const registrationSession = await this.registrationSessionsRepository.findById(
        body.sessionId,
        undefined,
        {transaction: tx}
      );

      if (
        !registrationSession ||
        !registrationSession.phoneVerified ||
        !registrationSession.emailVerified ||
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        registrationSession.isDeleted ||
        new Date(registrationSession.expiresAt) < new Date()
      ) {
        throw new HttpErrors.BadRequest('Session is not valid');
      }

      // ----------------------------
      //  Validate CIN & GSTIN
      // ----------------------------
      const companyWithCIN = await this.companyProfilesRepository.findOne(
        {where: {CIN: body.CIN, isDeleted: false}},
        {transaction: tx}
      );
      if (companyWithCIN) throw new HttpErrors.BadRequest('CIN already registered');

      const companyWithGSTIN = await this.companyProfilesRepository.findOne(
        {where: {GSTIN: body.GSTIN, isDeleted: false}},
        {transaction: tx}
      );
      if (companyWithGSTIN)
        throw new HttpErrors.BadRequest('GSTIN already registered');

      // ----------------------------
      //  Create User
      // ----------------------------
      const hashedPassword = await this.hasher.hashPassword(body.password);

      const newUserProfile = await this.usersRepository.create(
        {
          phone: registrationSession.phoneNumber,
          email: registrationSession.email,
          password: hashedPassword,
          isActive: false,
          isDeleted: false,
        },
        {transaction: tx}
      );

      // ----------------------------
      //  Create Company Profile
      // ----------------------------
      const newCompanyProfile = await this.companyProfilesRepository.create(
        {
          usersId: newUserProfile.id,
          companyName: body.companyName,
          CIN: body.CIN,
          GSTIN: body.GSTIN,
          dateOfIncorporation: body.dateOfIncorporation,
          cityOfIncorporation: body.cityOfIncorporation,
          stateOfIncorporation: body.stateOfIncorporation,
          countryOfIncorporation: body.countryOfIncorporation,
          udyamRegistrationNumber: body.udyamRegistrationNumber,
          isActive: false,
          isDeleted: false,
        },
        {transaction: tx}
      );

      // ----------------------------
      //  Check PAN duplicate
      // ----------------------------
      const isPanExist = await this.companyPanCardsRepository.findOne(
        {
          where: {
            and: [
              {submittedPanNumber: body.submittedPanDetails.submittedPanNumber},
              {isDeleted: false},
              {status: 1},
            ],
          },
        },
        {transaction: tx}
      );

      if (isPanExist)
        throw new HttpErrors.BadRequest('Pan already exists with another company');

      // ----------------------------
      //  Prepare PAN Data
      // ----------------------------
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const companyPanData: any = {
        submittedCompanyName: body.submittedPanDetails.submittedCompanyName,
        submittedPanNumber: body.submittedPanDetails.submittedPanNumber,
        submittedDateOfBirth: body.submittedPanDetails.submittedDateOfBirth,
        extractedCompanyName: body.extractedPanDetails?.extractedCompanyName,
        extractedPanNumber: body.extractedPanDetails?.extractedPanNumber,
        extractedDateOfBirth: body.extractedPanDetails?.extractedDateOfBirth,
        panCardDocumentId: body.panCardDocumentId,
        mode: body.humanInteraction ? 1 : 0,
        status: 0,
        isActive: false,
        isDeleted: false,
        companyProfilesId: newCompanyProfile.id,
      };

      // ----------------------------
      //  Human Interaction Required
      // ----------------------------
      if (body.humanInteraction) {
        await this.companyPanCardsRepository.create(companyPanData, {
          transaction: tx,
        });

        await this.kycApplicationsRepository.create(
          {
            roleValue: registrationSession.roleValue,
            usersId: newUserProfile.id,
            status: 0,
            humanInteraction: true,
            mode: 1,
            isActive: true,
            isDeleted: false,
            currentProgress: ['company_kyc'],
            identifierId: newCompanyProfile.id
          },
          {transaction: tx}
        );

        await tx.commit();

        return {
          success: true,
          message: 'Registration completed',
          kycStatus: 0,
        };
      }

      // ----------------------------
      //  Auto verification (No Human Interaction)
      // ----------------------------
      if (
        body.submittedPanDetails.submittedCompanyName !== body.companyName
      ) {
        throw new HttpErrors.BadRequest('PAN details do not match company name');
      }

      // // Basic validation: Submitted PAN should match Extracted PAN
      // if (
      //   body.extractedPanDetails?.extractedPanNumber &&
      //   body.extractedPanDetails.extractedPanNumber !==
      //   body.submittedPanDetails.submittedPanNumber
      // ) {
      //   throw new HttpErrors.BadRequest('PAN number mismatch');
      // }

      // Auto approve PAN
      companyPanData.status = 1; // Verified
      companyPanData.isActive = true;

      await this.companyPanCardsRepository.create(companyPanData, {
        transaction: tx,
      });

      // ----------------------------
      //  Create KYC (Auto Approved PAN)
      // ----------------------------
      await this.kycApplicationsRepository.create(
        {
          roleValue: registrationSession.roleValue,
          usersId: newUserProfile.id,
          status: 1,
          humanInteraction: false,
          mode: 0,
          isActive: true,
          isDeleted: false,
          currentProgress: ['company_kyc', 'pan_verified'],
        },
        {transaction: tx}
      );

      await this.fileUploadProvider.updateMediaUsedStatus([body.panCardDocumentId], true);
      const result = await this.rbacService.assignNewUserRole(newUserProfile.id, 'company');
      if (!result.success || !result.data) {
        if (process.env.NODE_ENV === 'dev') {
          throw new HttpErrors.InternalServerError('Error while assigning role to user');
        } else {
          throw new HttpErrors.InternalServerError('Internal server error');
        }
      }
      await tx.commit();

      return {
        success: true,
        message: 'Registration completed',
        kycStatus: 1,
      };

    } catch (error) {
      await tx.rollback();
      console.log('error while registering new company :', error);
      throw error;
    }
  }

  @post('/auth/company-login')
  async companyLogin(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {type: 'string'},
              password: {type: 'string'}
            }
          }
        }
      }
    })
    body: {email: string; password: string;}
  ): Promise<{success: boolean; message: string; accessToken: string; user: object}> {
    const userData = await this.usersRepository.findOne({
      where: {
        and: [
          {email: body.email},
          {isDeleted: false}
        ]
      }
    });

    if (!userData) {
      throw new HttpErrors.BadRequest('User not exist');
    }

    const company = await this.companyProfilesRepository.findOne({
      where: {
        and: [
          {usersId: userData.id},
          {isActive: true},
          {isDeleted: false}
        ]
      }
    });

    if (!company) {
      throw new HttpErrors.Unauthorized('Unauthorized access');
    }

    const user = await this.userService.verifyCredentials(body);

    const {roles, permissions} = await this.rbacService.getUserRoleAndPermissionsByRole(user.id!, 'company');

    if (!roles.includes('company')) {
      throw new HttpErrors.Forbidden('Access denied. Only company users can login here.');
    }

    const userProfile: UserProfile & {
      roles: string[];
      permissions: string[];
      phone: string;
    } = {
      [securityId]: user.id!,
      id: user.id!,
      email: user.email,
      phone: user.phone,
      roles,
      permissions,
    };

    const token = await this.jwtService.generateToken(userProfile);
    const profile = await this.rbacService.returnCompanyProfile(user.id, roles, permissions);
    return {
      success: true,
      message: "Company login successful",
      accessToken: token,
      user: profile
    };
  }

  // ------------------------------------------Approve KYC--------------------------------------------
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/auth/handle-kyc-application')
  async handleKYCApplication(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['userId', 'roleValue', 'identifierId', 'status'],
            properties: {
              userId: {type: 'string'},
              roleValue: {type: 'string'},
              identifierId: {type: 'string'},
              status: {type: 'number'}
            }
          }
        }
      }
    })
    body: {
      userId: string;
      roleValue: string;
      identifierId: string;
      status: number;
    }
  ): Promise<{success: boolean; message: string}> {

    const tx = await this.kycApplicationsRepository.dataSource.beginTransaction({
      isolationLevel: 'READ COMMITTED',
    });

    try {
      const kycApplication = await this.kycApplicationsRepository.findOne(
        {
          where: {
            and: [
              {usersId: body.userId},
              {roleValue: body.roleValue},
              {isActive: true},
              {isDeleted: false}
            ]
          },
          order: ['createdAt DESC']
        },
        {transaction: tx}
      );

      if (!kycApplication) {
        throw new HttpErrors.NotFound('No KYC application found');
      }

      let result;

      if (kycApplication.roleValue === 'company') {
        result = await this.handleCompanyKycApplication(
          kycApplication.id,
          body.identifierId,
          body.status,
          tx
        );

        await tx.commit();
        return {
          success: true,
          message: result.message
        };
      }

      throw new HttpErrors.BadRequest('Invalid role value');

    } catch (error) {
      await tx.rollback();
      console.log('error in kyc applications :', error);
      throw error;
    }
  }

  // --------------------------------------------- Company KYC Handler --------------------------------------------
  async handleCompanyKycApplication(
    applicationId: string,
    companyId: string,
    status: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any
  ) {
    try {
      const companyPanCard = await this.companyPanCardsRepository.findOne(
        {
          where: {companyProfilesId: companyId},
          order: ['createdAt DESC']
        }
      );

      if (!companyPanCard || !companyPanCard.id) {
        throw new HttpErrors.NotFound('Unable to fetch pan card details');
      }

      // update kyc application
      await this.kycApplicationsRepository.updateById(
        applicationId,
        {status},
        {transaction: tx}
      );

      // APPROVED
      if (status === 1) {
        await this.companyProfilesRepository.updateById(
          companyId,
          {isActive: true},
          {transaction: tx}
        );

        await this.companyPanCardsRepository.updateById(companyPanCard?.id, {status: 1})

        return {
          success: true,
          message: 'Company KYC approved successfully',
          kycStatus: 1
        };
      }

      // REJECTED
      if (status === 2) {
        await this.companyProfilesRepository.updateById(
          companyId,
          {isActive: false},
          {transaction: tx}
        );

        await this.companyPanCardsRepository.updateById(companyPanCard?.id, {status: 1})

        return {
          success: true,
          message: 'Company KYC rejected',
          kycStatus: 2
        };
      }

      throw new HttpErrors.BadRequest('Invalid status value');

    } catch (error) {
      console.log('error in handleCompanyKycApplication:', error);
      throw error;
    }
  }
}

