import {
  BindingScope,
  config,
  ContextTags,
  injectable,
  Provider,
} from '@loopback/core';
import {repository} from '@loopback/repository';
import multer from 'multer';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {MediaRepository} from '../repositories';
import {FileUploadHandler} from '../types';

/**
 * A provider to return an `Express` request handler from `multer` middleware
 */
@injectable({
  scope: BindingScope.TRANSIENT,
  tags: {[ContextTags.KEY]: FILE_UPLOAD_SERVICE},
})
export class FileUploadProvider implements Provider<FileUploadHandler> {
  constructor(
    @config() private options: multer.Options = {},
    @repository(MediaRepository)
    private mediaRepository: MediaRepository
  ) {
    if (!this.options.storage) {
      // Default to disk storage with the filename containing a timestamp
      this.options.storage = multer.diskStorage({
        destination: this.options.dest ?? undefined, // Use dest instead of destination
        filename: (req, file, cb) => {
          const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
          const fileName = `${timestamp}_${file.originalname}`;
          cb(null, fileName);
        },
      });
    }
  }

  value(): FileUploadHandler {
    return multer(this.options).any();
  }

  async updateMediaUsedStatus(mediaIds: string[], usedStatus: boolean) {
    try {
      if (!mediaIds || mediaIds.length === 0) {
        return;
      }

      for (const id of mediaIds) {
        await this.mediaRepository.updateById(id, {isUsed: usedStatus});
      };

      return;
    } catch (error) {
      console.log('error while updating used status for file of ids: ', mediaIds);
      console.log('error', error);
      return;
    }
  }
}
