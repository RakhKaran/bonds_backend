import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, HttpErrors, param} from '@loopback/rest';
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
}
