// services/owner.service.ts
import { APP_CONFIG } from '../utils/constants';

interface Hostel {
  id: string;
  name: string;
  location: string;
  capacity: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateHostelData {
  name: string;
  location: string;
  capacity: number;
}

export const ownerService = {
  async getHostels(): Promise<Hostel[]> {
    try {
      const token = localStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY);
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/owner/hostels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hostels');
      }

      return await response.json();
    } catch (error) {
      console.error('Get hostels error:', error);
      throw error;
    }
  },

  async getHostelById(hostelId: string): Promise<Hostel> {
    try {
      const token = localStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY);
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/owner/hostels/${hostelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hostel details');
      }

      return await response.json();
    } catch (error) {
      console.error('Get hostel error:', error);
      throw error;
    }
  },

  async createHostel(data: CreateHostelData): Promise<Hostel> {
    try {
      const token = localStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY);
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/owner/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create hostel');
      }

      return await response.json();
    } catch (error) {
      console.error('Create hostel error:', error);
      throw error;
    }
  },

  async updateHostel(hostelId: string, data: Partial<CreateHostelData>): Promise<Hostel> {
    try {
      const token = localStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY);
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/owner/hostels/${hostelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update hostel');
      }

      return await response.json();
    } catch (error) {
      console.error('Update hostel error:', error);
      throw error;
    }
  },

  async deleteHostel(hostelId: string): Promise<void> {
    try {
      const token = localStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY);
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/owner/hostels/${hostelId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete hostel');
      }
    } catch (error) {
      console.error('Delete hostel error:', error);
      throw error;
    }
  }
};

export default ownerService;
