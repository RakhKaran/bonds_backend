import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, HttpErrors, param, patch, requestBody} from '@loopback/rest';
import {authorize} from '../authorization';
import {AuthorizeSignatories, BankDetails, UserUploadedDocuments} from '../models';
import {TrusteeProfilesRepository} from '../repositories';
import {BankDetailsService} from '../services/bank-details.service';
import {AuthorizeSignatoriesService} from '../services/signatories.service';
import {UserUploadedDocumentsService} from '../services/user-documents.service';

export class AdminProfilesController {
  constructor(
    @repository(TrusteeProfilesRepository)
    private trusteeProfilesRepository: TrusteeProfilesRepository,
    @inject('service.userUploadedDocuments.service')
    private userUploadDocumentsService: UserUploadedDocumentsService,
    @inject('service.bankDetails.service')
    private bankDetailsService: BankDetailsService,
    @inject('services.AuthorizeSignatoriesService.service')
    private authorizeSignatoriesService: AuthorizeSignatoriesService,
  ) { }

  // ------------------------------------------------Trustee Profile API's-------------------------------------------------
  // fetch bank accounts...
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/trustee-profiles/{trusteeId}/bank-details')
  async fetchBankDetails(
    @param.path.string('trusteeId') trusteeId: string,
  ): Promise<{success: boolean; message: string; bankDetails: BankDetails[]}> {
    const trusteeProfile = await this.trusteeProfilesRepository.findOne({
      where: {
        and: [
          {id: trusteeId},
          {isDeleted: false}
        ]
      }
    });

    if (!trusteeProfile) {
      throw new HttpErrors.NotFound('Trustee not found');
    }

    const bankDetailsResponse = await this.bankDetailsService.fetchUserBankAccounts(trusteeProfile.usersId, 'trustee');

    return {
      success: true,
      message: 'Bank accounts',
      bankDetails: bankDetailsResponse.accounts
    }
  }

  // fetch bank account
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/trustee-profiles/{trusteeId}/bank-details/{accountId}')
  async fetchBankDetailsWithId(
    @param.path.string('trusteeId') trusteeId: string,
    @param.path.string('accountId') accountId: string,
  ): Promise<{success: boolean; message: string; bankDetails: BankDetails}> {
    const trusteeProfile = await this.trusteeProfilesRepository.findOne({
      where: {
        and: [
          {id: trusteeId},
          {isDeleted: false}
        ]
      }
    });

    if (!trusteeProfile) {
      throw new HttpErrors.NotFound('Trustee not found');
    }

    const bankDetailsResponse = await this.bankDetailsService.fetchUserBankAccount(accountId);

    return {
      success: true,
      message: 'Bank accounts',
      bankDetails: bankDetailsResponse.account
    }
  }

  // fetch authorize signatories...
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/trustee-profiles/{trusteeId}/authorize-signatory')
  async fetchAuthorizeSignatories(
    @param.path.string('trusteeId') trusteeId: string,
  ): Promise<{success: boolean; message: string; signatories: AuthorizeSignatories[]}> {
    const trusteeProfile = await this.trusteeProfilesRepository.findOne({
      where: {
        and: [
          {id: trusteeId},
          {isDeleted: false}
        ]
      }
    });

    if (!trusteeProfile) {
      throw new HttpErrors.NotFound('Trustee not found');
    }

    const signatoriesResponse = await this.authorizeSignatoriesService.fetchAuthorizeSignatories(trusteeProfile.usersId, 'trustee', trusteeProfile.id);

    return {
      success: true,
      message: 'Authorize signatories',
      signatories: signatoriesResponse.signatories
    }
  }

  // fetch authorize signatory
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/trustee-profiles/{trusteeId}/authorize-signatory/{signatoryId}')
  async fetchAuthorizeSignatory(
    @param.path.string('trusteeId') trusteeId: string,
    @param.path.string('signatoryId') signatoryId: string,
  ): Promise<{success: boolean; message: string; signatory: AuthorizeSignatories}> {
    const trusteeProfile = await this.trusteeProfilesRepository.findOne({
      where: {
        and: [
          {id: trusteeId},
          {isDeleted: false}
        ]
      }
    });

    if (!trusteeProfile) {
      throw new HttpErrors.NotFound('Trustee not found');
    }

    const signatoriesResponse = await this.authorizeSignatoriesService.fetchAuthorizeSignatory(signatoryId);

    return {
      success: true,
      message: 'Authorize signatory data',
      signatory: signatoriesResponse.signatory
    }
  }

  // fetch documents
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/trustee-profiles/{trusteeId}/documents')
  async fetchDocuments(
    @param.path.string('trusteeId') trusteeId: string,
  ): Promise<{success: boolean; message: string; documents: UserUploadedDocuments[]}> {
    const trusteeProfile = await this.trusteeProfilesRepository.findOne({
      where: {
        and: [
          {id: trusteeId},
          {isDeleted: false}
        ]
      }
    });

    if (!trusteeProfile) {
      throw new HttpErrors.NotFound('Trustee not found');
    }

    const documentsResponse = await this.userUploadDocumentsService.fetchDocumentsWithUser(trusteeProfile.usersId, trusteeProfile.id, 'trustee');

    return {
      success: true,
      message: 'Documents data',
      documents: documentsResponse.documents
    }
  }

  // fetch document...
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/trustee-profiles/{trusteeId}/documents/{documentId}')
  async fetchDocument(
    @param.path.string('trusteeId') trusteeId: string,
    @param.path.string('documentId') documentId: string,
  ): Promise<{success: boolean; message: string; document: UserUploadedDocuments}> {
    const trusteeProfile = await this.trusteeProfilesRepository.findOne({
      where: {
        and: [
          {id: trusteeId},
          {isDeleted: false}
        ]
      }
    });

    if (!trusteeProfile) {
      throw new HttpErrors.NotFound('Trustee not found');
    }

    const documentsResponse = await this.userUploadDocumentsService.fetchDocumentsWithId(documentId);

    return {
      success: true,
      message: 'Authorize signatory data',
      document: documentsResponse.document
    }
  }

  // super admin trustee documents approval API
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/trustee-profiles/document-verification')
  async documentVerification(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status', 'documentId'],
            properties: {
              status: {type: 'number'},
              documentId: {type: 'string'},
              reason: {type: 'string'}
            }
          }
        }
      }
    })
    body: {
      status: number;
      documentId: string;
      reason?: string;
    }
  ): Promise<{success: boolean; message: string}> {
    const result = await this.userUploadDocumentsService.updateDocumentStatus(body.documentId, body.status, body.reason ?? '');

    return result;
  }

  // super admin trustee bank account approval API
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/trustee-profiles/bank-account-verification')
  async bankAccountVerification(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status', 'accountId'],
            properties: {
              status: {type: 'number'},
              accountId: {type: 'string'},
              reason: {type: 'string'}
            }
          }
        }
      }
    })
    body: {
      status: number;
      accountId: string;
      reason?: string;
    }
  ): Promise<{success: boolean; message: string}> {
    const result = await this.bankDetailsService.updateAccountStatus(body.accountId, body.status, body.reason ?? '');

    return result;
  }

  // super admin trustee bank signatory approval API
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/trustee-profiles/authorize-signatory-verification')
  async authorizeSignatoryVerification(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status', 'signatoryId'],
            properties: {
              status: {type: 'number'},
              signatoryId: {type: 'string'},
              reason: {type: 'string'}
            }
          }
        }
      }
    })
    body: {
      status: number;
      signatoryId: string;
      reason?: string;
    }
  ): Promise<{success: boolean; message: string}> {
    const result = await this.authorizeSignatoriesService.updateSignatoryStatus(body.signatoryId, body.status, body.reason ?? '');

    return result;
  }
}
