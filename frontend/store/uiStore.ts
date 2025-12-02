import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ModalType =
  | 'register_position'
  | 'position_details'
  | 'reduce_leverage'
  | 'close_position'
  | 'alert_config'
  | null;

export type ThemeMode = 'light' | 'dark';

interface UIState {
  isDrawerOpen: boolean;
  selectedModal: ModalType;
  modalData: Record<string, any> | null;
  theme: ThemeMode;
  isSidebarCollapsed: boolean;
  notifications: {
    show: boolean;
    count: number;
  };

  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  openModal: (modal: ModalType, data?: Record<string, any>) => void;
  closeModal: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setNotificationCount: (count: number) => void;
  toggleNotifications: () => void;
  reset: () => void;
}

const initialState = {
  isDrawerOpen: false,
  selectedModal: null as ModalType,
  modalData: null,
  theme: 'dark' as ThemeMode,
  isSidebarCollapsed: false,
  notifications: {
    show: false,
    count: 0,
  },
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        toggleDrawer: () => {
          set(
            (state) => ({ isDrawerOpen: !state.isDrawerOpen }),
            false,
            'toggleDrawer'
          );
        },

        setDrawerOpen: (isDrawerOpen) => {
          set({ isDrawerOpen }, false, 'setDrawerOpen');
        },

        openModal: (modal, data) => {
          set(
            {
              selectedModal: modal,
              modalData: data || null,
            },
            false,
            'openModal'
          );
        },

        closeModal: () => {
          set(
            {
              selectedModal: null,
              modalData: null,
            },
            false,
            'closeModal'
          );
        },

        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
          if (typeof window !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
          }
        },

        toggleTheme: () => {
          const newTheme = get().theme === 'dark' ? 'light' : 'dark';
          get().setTheme(newTheme);
        },

        toggleSidebar: () => {
          set(
            (state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }),
            false,
            'toggleSidebar'
          );
        },

        setSidebarCollapsed: (isSidebarCollapsed) => {
          set({ isSidebarCollapsed }, false, 'setSidebarCollapsed');
        },

        setNotificationCount: (count) => {
          set(
            (state) => ({
              notifications: {
                ...state.notifications,
                count,
              },
            }),
            false,
            'setNotificationCount'
          );
        },

        toggleNotifications: () => {
          set(
            (state) => ({
              notifications: {
                ...state.notifications,
                show: !state.notifications.show,
              },
            }),
            false,
            'toggleNotifications'
          );
        },

        reset: () => {
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          isSidebarCollapsed: state.isSidebarCollapsed,
        }),
      }
    ),
    {
      name: 'UIStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
