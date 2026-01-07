import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ResumeDownloadResult } from 'shared/types';

export const useDownloadResume = () => {
  return useMutation<ResumeDownloadResult>({
    mutationFn: () => {
      return axios
        .get<Blob>('/api/about/resume', {
          responseType: 'blob',
        })
        .then((response) => {
          const disposition = response.headers['content-disposition'];
          const match = /filename="([^"]+)"/i.exec(disposition || '');
          const filename = match?.[1];

          if (!filename) {
            throw new Error('Filename not found in Content-Disposition header');
          }

          return { blob: response.data, filename };
        });
    },
  });
};
