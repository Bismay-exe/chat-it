import { create } from 'zustand';

interface UpdateState {
  isChecking: boolean;
  updateAvailable: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  channel: string;
  autoStartDownload: boolean;
  
  setChecking: (isChecking: boolean) => void;
  setUpdateAvailable: (version: string, url: string, notes: string, channel: string, autoStartDownload?: boolean) => void;
  closeUpdate: () => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  isChecking: false,
  updateAvailable: false,
  latestVersion: '',
  downloadUrl: '',
  releaseNotes: '',
  channel: 'stable',
  autoStartDownload: false,
  
  setChecking: (isChecking) => set({ isChecking }),
  setUpdateAvailable: (latestVersion, downloadUrl, releaseNotes, channel, autoStartDownload = false) => set({ 
    updateAvailable: true, 
    latestVersion, 
    downloadUrl, 
    releaseNotes,
    channel,
    autoStartDownload
  }),
  closeUpdate: () => set({ updateAvailable: false }),
}));
