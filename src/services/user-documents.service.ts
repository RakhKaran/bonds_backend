import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {UserUploadedDocuments} from '../models';
import {DocumentsRepository, UserUploadedDocumentsRepository} from '../repositories';
import {MediaService} from './media.service';

export class UserUploadedDocumentsService {
  constructor(
    @repository(UserUploadedDocumentsRepository)
    private userUploadedDocumentsRepository: UserUploadedDocumentsRepository,
    @repository(DocumentsRepository)
    private documentsRepository: DocumentsRepository,
    @inject('service.media.service')
    private mediaService: MediaService
  ) { }

  async uploadNewDocument(
    documentObject: Omit<UserUploadedDocuments, 'id'>
  ): Promise<{success: boolean; message: string; uploadedDocument: UserUploadedDocuments}> {
    const document = await this.documentsRepository.findOne({
      where: {
        and: [
          {id: documentObject.documentsId},
          {isActive: true},
          {isDeleted: false}
        ]
      }
    });

    if (!document) {
      throw new HttpErrors.NotFound('Invalid document type');
    }
    const uploadedDocument = await this.userUploadedDocumentsRepository.create(documentObject);
    await this.mediaService.updateMediaUsedStatus([documentObject.documentsFileId], true);

    return {
      success: true,
      message: 'Document uploaded',
      uploadedDocument: uploadedDocument
    };
  }

  async uploadNewDocuments(
    documentObjects: Array<Omit<UserUploadedDocuments, 'id'>>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any  // transaction
  ): Promise<{success: boolean; message: string; uploadedDocuments: UserUploadedDocuments[]}> {
    const documentIds = documentObjects.map((doc) => doc.documentsId);
    for (const docId of documentIds) {
      const document = await this.documentsRepository.findOne({
        where: {
          and: [
            {id: docId},
            {isActive: true},
            {isDeleted: false}
          ]
        }
      });

      if (!document) {
        throw new HttpErrors.NotFound('Invalid document type');
      }
    }

    const documentFileUploadIds = documentObjects.map((doc) => doc.documentsFileId);
    const uploadedDocuments = await this.userUploadedDocumentsRepository.createAll(documentObjects, {transaction: tx});
    await this.mediaService.updateMediaUsedStatus(documentFileUploadIds, true);
    return {
      success: true,
      message: 'Document uploaded',
      uploadedDocuments: uploadedDocuments
    };
  }
}
