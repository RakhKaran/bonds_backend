import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {UserUploadedDocuments} from '../models';
import {DocumentsRepository, ScreensRepository, UserUploadedDocumentsRepository} from '../repositories';
import {MediaService} from './media.service';

export class UserUploadedDocumentsService {
  constructor(
    @repository(UserUploadedDocumentsRepository)
    private userUploadedDocumentsRepository: UserUploadedDocumentsRepository,
    @repository(DocumentsRepository)
    private documentsRepository: DocumentsRepository,
    @repository(ScreensRepository)
    private screensRepository: ScreensRepository,
    @inject('service.media.service')
    private mediaService: MediaService
  ) { }

  async fetchDocuments(usersId: string, identifierId: string, roleValue: string, route: string): Promise<{
    success: boolean;
    message: string;
    documents: object[];
  }> {
    const screenByRoute = await this.screensRepository.findOne({
      where: {
        and: [
          {route: route},
          {isActive: true},
          {isDeleted: false}
        ]
      },
      include: [
        {relation: 'documents'}
      ]
    });

    if (!screenByRoute) {
      console.log('no screen with given route found');
      throw new HttpErrors.NotFound('No documents found');
    };

    const documentIds = screenByRoute.documents.map((document) => document.id) || [];

    const documentsData: Array<{documentId: string; documentFile: object | null}> = [];
    for (const documentId of documentIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documentData: any = await this.userUploadedDocumentsRepository.findOne({
        where: {
          and: [
            {isActive: true},
            {isDeleted: false},
            {usersId: usersId},
            {identifierId: identifierId},
            {roleValue: roleValue},
            {documentsId: documentId}
          ]
        },
        include: [{relation: 'documentsFile', scope: {fields: {id: true, fileUrl: true, fileOriginalName: true}}}]
      });

      if (!documentData) {
        documentsData.push({
          documentId,
          documentFile: null
        })
      } else {
        documentsData.push({
          documentId,
          documentFile: {
            mode: documentData.mode,
            status: documentData.status,
            verifiedAt: documentData.verifiedAt,
            documentFile: documentData.documentsFile
          }
        });
      }
    }

    return {
      success: true,
      message: 'Documents',
      documents: documentsData
    }
  }

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
