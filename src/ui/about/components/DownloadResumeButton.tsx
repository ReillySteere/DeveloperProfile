import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from 'ui/shared/components';
import { useDownloadResume } from '../hooks/useDownloadResume';

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export const DownloadResumeButton = () => {
  const { mutate: downloadResume, isPending } = useDownloadResume();

  return (
    <Button
      onClick={() =>
        downloadResume(undefined, {
          onSuccess: ({ blob, filename }) =>
            triggerBrowserDownload(blob, filename),
        })
      }
      disabled={isPending}
      leftIcon={
        isPending ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Download size={16} />
        )
      }
    >
      {isPending ? 'Downloading...' : 'Download Resume'}
    </Button>
  );
};
