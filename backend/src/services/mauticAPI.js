import axios from 'axios';
import { decrypt } from '../utils/encryption.js';

class MauticAPIClient {
  constructor(clientConfig) {
    this.baseUrl = clientConfig.baseUrl.replace(/\/$/, '');
    this.clientId = decrypt(clientConfig.clientId);
    this.clientSecret = decrypt(clientConfig.clientSecret);
    this.accessToken = clientConfig.accessToken ? decrypt(clientConfig.accessToken) : null;
    this.refreshToken = clientConfig.refreshToken ? decrypt(clientConfig.refreshToken) : null;
    this.tokenExpiresAt = clientConfig.tokenExpiresAt;
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiresAt) return true;
    return new Date() >= new Date(this.tokenExpiresAt);
  }

  /**
   * Refresh OAuth2 access token
   */
  async refreshAccessToken() {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/v2/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || this.refreshToken;
      
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiresAt: this.tokenExpiresAt,
      };
    } catch (error) {
      console.error('Token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get initial access token using OAuth2 password grant
   */
  async getInitialToken(username, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/v2/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'password',
        username,
        password,
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiresAt: this.tokenExpiresAt,
      };
    } catch (error) {
      console.error('Initial token fetch failed:', error.response?.data || error.message);
      throw new Error('Failed to get initial access token');
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    // Check if we have a valid access token
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first by providing username/password or manually setting tokens.');
    }

    // Refresh token if expired
    if (this.isTokenExpired() && this.refreshToken) {
      await this.refreshAccessToken();
    }

    try {
      const config = {
        method,
        url: `${this.baseUrl}/api${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Test connection to Mautic API
   */
  async testConnection() {
    try {
      const data = await this.makeRequest('/contacts?limit=1');
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.errors?.[0]?.message || error.message 
      };
    }
  }

  /**
   * Fetch contacts with pagination
   */
  async fetchContacts(page = 1, limit = 100) {
    const start = (page - 1) * limit;
    return await this.makeRequest(`/contacts?start=${start}&limit=${limit}&orderBy=id&orderByDir=DESC`);
  }

  /**
   * Fetch all contacts (handles pagination)
   */
  async fetchAllContacts() {
    let allContacts = [];
    let page = 1;
    const limit = 100;
    
    while (true) {
      const response = await this.fetchContacts(page, limit);
      const contacts = response.contacts || {};
      const contactsArray = Object.values(contacts);
      
      if (contactsArray.length === 0) break;
      
      allContacts = allContacts.concat(contactsArray);
      
      if (contactsArray.length < limit) break;
      page++;
    }
    
    return allContacts;
  }

  /**
   * Fetch campaigns
   */
  async fetchCampaigns(page = 1, limit = 100) {
    const start = (page - 1) * limit;
    return await this.makeRequest(`/campaigns?start=${start}&limit=${limit}`);
  }

  /**
   * Fetch all campaigns
   */
  async fetchAllCampaigns() {
    let allCampaigns = [];
    let page = 1;
    const limit = 100;
    
    while (true) {
      const response = await this.fetchCampaigns(page, limit);
      const campaigns = response.campaigns || {};
      const campaignsArray = Object.values(campaigns);
      
      if (campaignsArray.length === 0) break;
      
      allCampaigns = allCampaigns.concat(campaignsArray);
      
      if (campaignsArray.length < limit) break;
      page++;
    }
    
    return allCampaigns;
  }

  /**
   * Fetch emails
   */
  async fetchEmails(page = 1, limit = 100) {
    const start = (page - 1) * limit;
    return await this.makeRequest(`/emails?start=${start}&limit=${limit}`);
  }

  /**
   * Fetch all emails
   */
  async fetchAllEmails() {
    let allEmails = [];
    let page = 1;
    const limit = 100;
    
    while (true) {
      const response = await this.fetchEmails(page, limit);
      const emails = response.emails || {};
      const emailsArray = Object.values(emails);
      
      if (emailsArray.length === 0) break;
      
      allEmails = allEmails.concat(emailsArray);
      
      if (emailsArray.length < limit) break;
      page++;
    }
    
    return allEmails;
  }

  /**
   * Fetch statistics for a specific email
   */
  async fetchEmailStats(emailId) {
    return await this.makeRequest(`/emails/${emailId}`);
  }

  /**
   * Fetch contact statistics
   */
  async fetchContactStats() {
    const response = await this.makeRequest('/contacts?limit=1');
    return {
      total: response.total || 0,
    };
  }

  /**
   * Fetch segments/lists
   */
  async fetchSegments(page = 1, limit = 100) {
    const start = (page - 1) * limit;
    return await this.makeRequest(`/segments?start=${start}&limit=${limit}`);
  }

  /**
   * Fetch all segments
   */
  async fetchAllSegments() {
    let allSegments = [];
    let page = 1;
    const limit = 100;
    
    while (true) {
      const response = await this.fetchSegments(page, limit);
      const segments = response.lists || {}; // Note: Mautic API returns 'lists' not 'segments'
      const segmentsArray = Object.values(segments);
      
      if (segmentsArray.length === 0) break;
      
      allSegments = allSegments.concat(segmentsArray);
      
      if (segmentsArray.length < limit) break;
      page++;
    }
    
    return allSegments;
  }
}

export default MauticAPIClient;
