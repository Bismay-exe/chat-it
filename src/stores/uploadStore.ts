import { create } from 'zustand';

interface UploadStore {
   uploads: Record<string, XMLHttpRequest>;
   addUpload: (id: string, xhr: XMLHttpRequest) => void;
   removeUpload: (id: string) => void;
   cancelUpload: (id: string) => void;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
   uploads: {},
   addUpload: (id, xhr) => set(state => ({ uploads: { ...state.uploads, [id]: xhr } })),
   removeUpload: (id) => set(state => {
      const newUploads = { ...state.uploads };
      delete newUploads[id];
      return { uploads: newUploads };
   }),
   cancelUpload: (id) => {
      const xhr = get().uploads[id];
      if (xhr) {
         xhr.abort();
         get().removeUpload(id);
      }
   }
}));
