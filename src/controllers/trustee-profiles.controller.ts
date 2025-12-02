import {inject} from '@loopback/core';
import {IsolationLevel, repository} from '@loopback/repository';
import {HttpErrors, post, requestBody} from '@loopback/rest';
import {AuthorizeSignatories, BankDetails, UserUploadedDocuments} from '../models';
import {KycApplicationsRepository, TrusteeProfilesRepository} from '../repositories';
import {BankDetailsService} from '../services/bank-details.service';
import {AuthorizeSignatoriesService} from '../services/signatories.service';
import {UserUploadedDocumentsService} from '../services/user-documents.service';

export class TrusteeProfilesController {
  constructor(
    @repository(TrusteeProfilesRepository)
    private trusteeProfilesRepository: TrusteeProfilesRepository,
    @repository(KycApplicationsRepository)
    private kycApplicationsRepository: KycApplicationsRepository,
    @inject('service.userUploadedDocuments.service')
    private userUploadDocumentsService: UserUploadedDocumentsService,
    @inject('service.bankDetails.service')
    private bankDetailsService: BankDetailsService,
    @inject('services.AuthorizeSignatoriesService.service')
    private authorizeSignatoriesService: AuthorizeSignatoriesService,
  ) { }

  // trustee flow will be like => Basic info, documents, bank details, authorize signatories, bank account details, agreement, verification.

  // fetch KYC application status...
  async getKycApplicationStatus(
    applicationId: string
  ): Promise<string[]> {
    const kycApplication = await this.kycApplicationsRepository.findById(applicationId);

    return kycApplication.currentProgress ?? [];
  }

  // update KYC application status...
  async updateKycProgress(appId: string, step: string) {
    const kyc = await this.kycApplicationsRepository.findById(appId);

    const progress = Array.isArray(kyc.currentProgress) ? kyc.currentProgress : [];

    if (!progress.includes(step)) {
      progress.push(step);
      await this.kycApplicationsRepository.updateById(appId, {currentProgress: progress});
    }

    return progress;
  }

  // for trustees but without login just for KYC
  @post('/trustee-profiles/kyc-upload-documents')
  async uploadTrusteeKYCDocuments(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['usersId', 'documents'],
            properties: {
              usersId: {type: 'string'},
              documents: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['documentsId', 'documentsFileId'],
                  properties: {
                    documentsId: {type: 'string'},
                    documentsFileId: {type: 'string'}
                  }
                }
              }
            }
          }
        }
      }
    })
    body: {
      usersId: string;
      documents: {documentsId: string; documentsFileId: string;}[];
    }
  ): Promise<{success: boolean; message: string; uploadedDocuments: UserUploadedDocuments[]; currentProgress: string[]}> {
    const tx = await this.trusteeProfilesRepository.dataSource.beginTransaction({IsolationLevel: IsolationLevel.READ_COMMITTED});

    try {
      const trustee = await this.trusteeProfilesRepository.findOne(
        {where: {usersId: body.usersId, isDeleted: false}},
        {transaction: tx}
      );

      if (!trustee) throw new HttpErrors.NotFound("Trustee not found");

      const newDocs = body.documents.map(doc => new UserUploadedDocuments({
        ...doc,
        roleValue: 'trustee',
        identifierId: trustee.id,
        usersId: body.usersId,
        status: 0,
        mode: 1,
        isActive: true,
        isDeleted: false,
      }));

      const result = await this.userUploadDocumentsService.uploadNewDocuments(newDocs, tx);

      const currentProgress = await this.updateKycProgress(trustee.kycApplicationsId, "trustee_documents");

      await tx.commit();

      return {...result, currentProgress};
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  // for trustees but without login just for KYC
  @post('/trustee-profiles/kyc-bank-details')
  async uploadTrusteeBankDetails(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['usersId', 'bankDetails'],
            properties: {
              usersId: {type: 'string'},
              bankDetails: {
                type: 'object',
                required: ['bankName', 'bankShortCode', 'ifscCode', 'branchName', 'bankAddress', 'accountType', 'accountHolderName', 'accountNumber', 'bankAccountProofType', 'bankAccountProofId'],
                properties: {
                  bankName: {type: 'string'},
                  bankShortCode: {type: 'string'},
                  ifscCode: {type: 'string'},
                  branchName: {type: 'string'},
                  bankAddress: {type: 'string'},
                  accountType: {type: 'number'},
                  accountHolderName: {type: 'string'},
                  accountNumber: {type: 'string'},
                  bankAccountProofType: {type: 'number'},
                  bankAccountProofId: {type: 'string'}
                }
              }
            }
          }
        }
      }
    })
    body: {
      usersId: string;
      bankDetails: {
        bankName: string;
        bankShortCode: string;
        ifscCode: string;
        branchName: string;
        bankAddress: string;
        accountType: number;
        accountHolderName: string;
        accountNumber: string;
        bankAccountProofType: number;
        bankAccountProofId: string;
      }
    }
  ): Promise<{
    success: boolean;
    message: string;
    account: BankDetails;
    currentProgress: string[];
  }> {
    const trustee = await this.trusteeProfilesRepository.findOne({
      where: {usersId: body.usersId, isDeleted: false}
    });

    if (!trustee) throw new HttpErrors.NotFound("Trustee not found");

    const bankData = new BankDetails({
      ...body.bankDetails,
      usersId: body.usersId,
      mode: 1,
      status: 1,
      roleValue: 'trustee'
    });

    const result = await this.bankDetailsService.createNewBankAccount(bankData);

    const currentProgress = await this.updateKycProgress(trustee.kycApplicationsId, "trustee_bank_details");

    return {...result, currentProgress};;
  }

  // for trustees but without login just for KYC
  @post('/trustee-profiles/kyc-authorize-signatories')
  async uploadAuthorizeSignatories(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['usersId', 'signatories'],
            properties: {
              usersId: {type: 'string'},
              signatories: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['fullName', 'email', 'phone', 'submittedPanFullName', 'submittedPanNumber', 'submittedDateOfBirth', 'panCardFileId', 'boardResolutionFileId', 'designationType', 'designationValue'],
                  properties: {
                    fullName: {type: 'string'},
                    email: {type: 'string'},
                    phone: {type: 'string'},
                    extractedPanFullName: {type: 'string'},
                    extractedPanNumber: {type: 'string'},
                    extractedDateOfBirth: {type: 'string'},
                    submittedPanFullName: {type: 'string'},
                    submittedPanNumber: {type: 'string'},
                    submittedDateOfBirth: {type: 'string'},
                    panCardFileId: {type: 'string'},
                    boardResolutionFileId: {type: 'string'},
                    designationType: {type: 'string'},
                    designationValue: {type: 'string'}
                  }
                }
              }
            }
          }
        }
      }
    })
    body: {
      usersId: string;
      signatories: Array<{
        fullName: string;
        email: string;
        phone: string;
        extractedPanFullName?: string;
        extractedPanNumber?: string;
        extractedDateOfBirth?: string;
        submittedPanFullName: string;
        submittedPanNumber: string;
        submittedDateOfBirth: string;
        panCardFileId: string;
        boardResolutionFileId: string;
        designationType: string;
        designationValue: string;
      }>
    }
  ): Promise<{
    success: boolean;
    message: string;
    createdAuthorizeSignatories: AuthorizeSignatories[];
    erroredAuthrizeSignatories: Array<{
      fullName: string;
      email: string;
      phone: string;
      submittedPanNumber: string;
      message: string;
    }>;
    currentProgress: string[];
  }> {
    const tx = await this.trusteeProfilesRepository.dataSource.beginTransaction({IsolationLevel: IsolationLevel.READ_COMMITTED});

    try {
      const trustee = await this.trusteeProfilesRepository.findOne(
        {where: {usersId: body.usersId, isDeleted: false}},
        {transaction: tx}
      );

      if (!trustee) throw new HttpErrors.NotFound("Trustee not found");

      const signatoriesData = body.signatories.map(s => new AuthorizeSignatories({
        ...s,
        usersId: body.usersId,
        roleValue: "trustee",
        identifierId: trustee.id,
        isActive: true,
        isDeleted: false
      }));

      const result = await this.authorizeSignatoriesService.createAuthorizeSignatories(signatoriesData, tx);

      let currentProgress = await this.getKycApplicationStatus(trustee.kycApplicationsId);

      if (result.createdAuthorizeSignatories.length > 0) {
        currentProgress = await this.updateKycProgress(trustee.kycApplicationsId, "trustee_authorized_signatories");
      }

      await tx.commit();
      return {...result, currentProgress};

    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  // for trustees but without login just for KYC
  @post('/trustee-profiles/kyc-authorize-signatory')
  async uploadAuthorizeSignatory(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['usersId', 'signatory'],
            properties: {
              usersId: {type: 'string'},
              signatory: {
                type: 'object',
                required: ['fullName', 'email', 'phone', 'submittedPanFullName', 'submittedPanNumber', 'submittedDateOfBirth', 'panCardFileId', 'boardResolutionFileId', 'designationType', 'designationValue'],
                properties: {
                  fullName: {type: 'string'},
                  email: {type: 'string'},
                  phone: {type: 'string'},
                  extractedPanFullName: {type: 'string'},
                  extractedPanNumber: {type: 'string'},
                  extractedDateOfBirth: {type: 'string'},
                  submittedPanFullName: {type: 'string'},
                  submittedPanNumber: {type: 'string'},
                  submittedDateOfBirth: {type: 'string'},
                  panCardFileId: {type: 'string'},
                  boardResolutionFileId: {type: 'string'},
                  designationType: {type: 'string'},
                  designationValue: {type: 'string'}
                }
              }
            }
          }
        }
      }
    })
    body: {
      usersId: string;
      signatory: {
        fullName: string;
        email: string;
        phone: string;
        extractedPanFullName?: string;
        extractedPanNumber?: string;
        extractedDateOfBirth?: string;
        submittedPanFullName: string;
        submittedPanNumber: string;
        submittedDateOfBirth: string;
        panCardFileId: string;
        boardResolutionFileId: string;
        designationType: string;
        designationValue: string;
      }
    }
  ): Promise<{
    success: boolean;
    message: string;
    signatory: AuthorizeSignatories;
    currentProgress: string[];
  }> {
    const tx = await this.trusteeProfilesRepository.dataSource.beginTransaction({IsolationLevel: IsolationLevel.READ_COMMITTED});

    try {
      const trustee = await this.trusteeProfilesRepository.findOne(
        {where: {usersId: body.usersId, isDeleted: false}},
        {transaction: tx}
      );

      if (!trustee) throw new HttpErrors.NotFound("Trustee not found");

      const signatoriesData = new AuthorizeSignatories({
        ...body.signatory,
        usersId: body.usersId,
        roleValue: "trustee",
        identifierId: trustee.id,
        isActive: true,
        isDeleted: false
      });

      const result = await this.authorizeSignatoriesService.createAuthorizeSignatory(signatoriesData);

      const currentProgress = await this.updateKycProgress(trustee.kycApplicationsId, "trustee_authorized_signatories");

      await tx.commit();
      return {...result, currentProgress};

    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
}
