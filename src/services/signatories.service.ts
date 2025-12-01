import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {AuthorizeSignatories} from '../models';
import {AuthorizeSignatoriesRepository} from '../repositories';
import {MediaService} from './media.service';

export class AuthorizeSignatoriesService {
  constructor(
    @repository(AuthorizeSignatoriesRepository)
    private authorizeSignatoriesRepository: AuthorizeSignatoriesRepository,
    @inject('service.media.service')
    private mediaService: MediaService
  ) { }

  // create new authorize signatories...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createAuthorizeSignatories(signatories: Omit<AuthorizeSignatories, 'id'>[], tx: any): Promise<{
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
  }> {
    const createdAuthorizeSignatories: AuthorizeSignatories[] = [];
    const erroredAuthrizeSignatories: Array<{
      fullName: string;
      email: string;
      phone: string;
      submittedPanNumber: string;
      message: string;
    }> = [];

    const mediaIds: string[] = [];

    for (const signatory of signatories) {
      // prepare name checks
      const extractedName = signatory.extractedPanFullName?.trim().toLowerCase();
      const submittedPanName = signatory.submittedPanFullName?.trim().toLowerCase();
      const fullName = signatory.fullName.trim().toLowerCase();

      const nameMatches =
        (extractedName?.includes(fullName)) ||
        (submittedPanName?.includes(fullName));

      // CASE 1: OCR present → try auto mode
      if (signatory.extractedPanNumber && signatory.extractedPanFullName && signatory.extractedDateOfBirth) {

        if ((signatory.extractedPanNumber === signatory.submittedPanNumber) && nameMatches) {
          signatory.mode = 0; // auto
          signatory.status = 1; // approved
          signatory.verifiedAt = new Date();

          try {
            const createdSignatory = await this.authorizeSignatoriesRepository.create(signatory, {transaction: tx});
            createdAuthorizeSignatories.push(createdSignatory);
            mediaIds.push(createdSignatory.panCardFileId, createdSignatory.boardResolutionFileId);
            continue;
          } catch (dbErr) {
            if (dbErr?.code === '23505') {
              erroredAuthrizeSignatories.push({
                fullName: signatory.fullName,
                email: signatory.email,
                phone: signatory.phone,
                submittedPanNumber: signatory.submittedPanNumber,
                message: 'This PAN is already added for this company/role',
              });
              continue;
            }
            throw dbErr;
          }

        } else {
          erroredAuthrizeSignatories.push({
            fullName: signatory.fullName,
            email: signatory.email,
            phone: signatory.phone,
            submittedPanNumber: signatory.submittedPanNumber,
            message: 'Fullname does not match with given pan',
          });
          continue;
        }

      }

      // CASE 2: Manual mode (no OCR)
      if (submittedPanName?.includes(fullName)) {
        signatory.mode = 1;
        signatory.status = 0; // under review

        try {
          const createdSignatory = await this.authorizeSignatoriesRepository.create(signatory, {transaction: tx});
          createdAuthorizeSignatories.push(createdSignatory);
          mediaIds.push(createdSignatory.panCardFileId, createdSignatory.boardResolutionFileId);
          continue;
        } catch (dbErr) {
          if (dbErr?.code === '23505') {
            erroredAuthrizeSignatories.push({
              fullName: signatory.fullName,
              email: signatory.email,
              phone: signatory.phone,
              submittedPanNumber: signatory.submittedPanNumber,
              message: 'This PAN is already added for this company/role',
            });
            continue;
          }
          throw dbErr;
        }

      } else {
        erroredAuthrizeSignatories.push({
          fullName: signatory.fullName,
          email: signatory.email,
          phone: signatory.phone,
          submittedPanNumber: signatory.submittedPanNumber,
          message: 'Fullname does not match with pan card',
        });
      }
    }

    await this.mediaService.updateMediaUsedStatus(mediaIds, true);

    return {
      success: true,
      message: 'Authorize signatories data',
      createdAuthorizeSignatories,
      erroredAuthrizeSignatories
    };
  }
}
