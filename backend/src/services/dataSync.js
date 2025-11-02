import { PrismaClient } from '@prisma/client';
import MauticAPIClient from './mauticAPI.js';
import { encrypt } from '../utils/encryption.js';

const prisma = new PrismaClient();

class DataSyncService {
  /**
   * Sync contacts for a specific client
   */
  async syncContacts(clientId) {
    try {
      const client = await prisma.mauticClient.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const mauticAPI = new MauticAPIClient(client);
      
      // Check if token needs refresh
      if (mauticAPI.isTokenExpired() && client.refreshToken) {
        const tokens = await mauticAPI.refreshAccessToken();
        await this.updateClientTokens(clientId, tokens);
      }

      const contacts = await mauticAPI.fetchAllContacts();
      
      // Upsert contacts to database
      let synced = 0;
      for (const contact of contacts) {
        await prisma.contact.upsert({
          where: {
            clientId_mauticContactId: {
              clientId: clientId,
              mauticContactId: parseInt(contact.id),
            },
          },
          update: {
            firstName: contact.fields?.all?.firstname || null,
            lastName: contact.fields?.all?.lastname || null,
            email: contact.fields?.all?.email || null,
            phone: contact.fields?.all?.phone || null,
            company: contact.fields?.all?.company || null,
            city: contact.fields?.all?.city || null,
            country: contact.fields?.all?.country || null,
            lastActive: contact.lastActive ? new Date(contact.lastActive) : null,
            points: parseInt(contact.points) || 0,
            updatedAt: new Date(),
          },
          create: {
            clientId: clientId,
            mauticContactId: parseInt(contact.id),
            firstName: contact.fields?.all?.firstname || null,
            lastName: contact.fields?.all?.lastname || null,
            email: contact.fields?.all?.email || null,
            phone: contact.fields?.all?.phone || null,
            company: contact.fields?.all?.company || null,
            city: contact.fields?.all?.city || null,
            country: contact.fields?.all?.country || null,
            lastActive: contact.lastActive ? new Date(contact.lastActive) : null,
            points: parseInt(contact.points) || 0,
          },
        });
        synced++;
      }

      await prisma.mauticClient.update({
        where: { id: clientId },
        data: { lastSyncAt: new Date() },
      });

      return { success: true, synced, total: contacts.length };
    } catch (error) {
      console.error(`Error syncing contacts for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Sync campaigns for a specific client
   */
  async syncCampaigns(clientId) {
    try {
      const client = await prisma.mauticClient.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const mauticAPI = new MauticAPIClient(client);
      
      if (mauticAPI.isTokenExpired() && client.refreshToken) {
        const tokens = await mauticAPI.refreshAccessToken();
        await this.updateClientTokens(clientId, tokens);
      }

      const campaigns = await mauticAPI.fetchAllCampaigns();
      
      let synced = 0;
      for (const campaign of campaigns) {
        await prisma.campaign.upsert({
          where: {
            clientId_mauticCampaignId: {
              clientId: clientId,
              mauticCampaignId: parseInt(campaign.id),
            },
          },
          update: {
            name: campaign.name,
            description: campaign.description,
            isPublished: campaign.isPublished || false,
            totalContacts: parseInt(campaign.stats?.total_contacts || 0),
            updatedAt: new Date(),
          },
          create: {
            clientId: clientId,
            mauticCampaignId: parseInt(campaign.id),
            name: campaign.name,
            description: campaign.description,
            isPublished: campaign.isPublished || false,
            totalContacts: parseInt(campaign.stats?.total_contacts || 0),
          },
        });
        synced++;
      }

      return { success: true, synced, total: campaigns.length };
    } catch (error) {
      console.error(`Error syncing campaigns for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Sync email stats for a specific client
   */
  async syncEmailStats(clientId) {
    try {
      const client = await prisma.mauticClient.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const mauticAPI = new MauticAPIClient(client);
      
      if (mauticAPI.isTokenExpired() && client.refreshToken) {
        const tokens = await mauticAPI.refreshAccessToken();
        await this.updateClientTokens(clientId, tokens);
      }

      const emails = await mauticAPI.fetchAllEmails();
      
      let synced = 0;
      for (const email of emails) {
        const sentCount = parseInt(email.sentCount) || 0;
        const readCount = parseInt(email.readCount) || 0;
        const clickedCount = parseInt(email.clickCount) || 0;
        const failedCount = parseInt(email.failedCount) || 0;
        
        const openRate = sentCount > 0 ? (readCount / sentCount) * 100 : 0;
        const clickRate = sentCount > 0 ? (clickedCount / sentCount) * 100 : 0;

        await prisma.emailStat.upsert({
          where: {
            clientId_mauticEmailId: {
              clientId: clientId,
              mauticEmailId: parseInt(email.id),
            },
          },
          update: {
            subject: email.subject,
            name: email.name,
            sentCount,
            readCount,
            clickedCount,
            failedCount,
            openRate: parseFloat(openRate.toFixed(2)),
            clickRate: parseFloat(clickRate.toFixed(2)),
            publishedAt: email.publishUp ? new Date(email.publishUp) : null,
            updatedAt: new Date(),
          },
          create: {
            clientId: clientId,
            mauticEmailId: parseInt(email.id),
            subject: email.subject,
            name: email.name,
            sentCount,
            readCount,
            clickedCount,
            failedCount,
            openRate: parseFloat(openRate.toFixed(2)),
            clickRate: parseFloat(clickRate.toFixed(2)),
            publishedAt: email.publishUp ? new Date(email.publishUp) : null,
          },
        });
        synced++;
      }

      return { success: true, synced, total: emails.length };
    } catch (error) {
      console.error(`Error syncing email stats for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Sync segments for a specific client
   */
  async syncSegments(clientId) {
    try {
      const client = await prisma.mauticClient.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const mauticAPI = new MauticAPIClient(client);
      
      if (mauticAPI.isTokenExpired() && client.refreshToken) {
        const tokens = await mauticAPI.refreshAccessToken();
        await this.updateClientTokens(clientId, tokens);
      }

      const segments = await mauticAPI.fetchAllSegments();
      
      // Upsert segments to database
      let synced = 0;
      for (const segment of segments) {
        await prisma.segment.upsert({
          where: {
            clientId_mauticSegmentId: {
              clientId: clientId,
              mauticSegmentId: parseInt(segment.id),
            },
          },
          update: {
            name: segment.name,
            description: segment.description || null,
            isPublished: segment.isPublished === true || segment.isPublished === 1,
            isGlobal: segment.isGlobal === true || segment.isGlobal === 1,
            contactCount: parseInt(segment.contactCount) || 0,
            createdBy: segment.createdBy ? String(segment.createdBy) : null,
            dateAdded: segment.dateAdded ? new Date(segment.dateAdded) : null,
            dateModified: segment.dateModified ? new Date(segment.dateModified) : null,
            updatedAt: new Date(),
          },
          create: {
            clientId: clientId,
            mauticSegmentId: parseInt(segment.id),
            name: segment.name,
            description: segment.description || null,
            isPublished: segment.isPublished === true || segment.isPublished === 1,
            isGlobal: segment.isGlobal === true || segment.isGlobal === 1,
            contactCount: parseInt(segment.contactCount) || 0,
            createdBy: segment.createdBy ? String(segment.createdBy) : null,
            dateAdded: segment.dateAdded ? new Date(segment.dateAdded) : null,
            dateModified: segment.dateModified ? new Date(segment.dateModified) : null,
          },
        });
        synced++;
      }

      return { success: true, synced, total: segments.length };
    } catch (error) {
      console.error(`Error syncing segments for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Sync all data for a specific client
   */
  async syncAllData(clientId) {
    try {
      const contactsResult = await this.syncContacts(clientId);
      const campaignsResult = await this.syncCampaigns(clientId);
      const emailsResult = await this.syncEmailStats(clientId);
      const segmentsResult = await this.syncSegments(clientId);

      return {
        success: true,
        results: {
          contacts: contactsResult,
          campaigns: campaignsResult,
          emails: emailsResult,
          segments: segmentsResult,
        },
      };
    } catch (error) {
      console.error(`Error syncing all data for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Sync all active clients
   */
  async syncAllClients() {
    try {
      const clients = await prisma.mauticClient.findMany({
        where: { isActive: true },
      });

      const results = [];
      for (const client of clients) {
        try {
          const result = await this.syncAllData(client.id);
          results.push({
            clientId: client.id,
            clientName: client.clientName,
            ...result,
          });
        } catch (error) {
          results.push({
            clientId: client.id,
            clientName: client.clientName,
            success: false,
            error: error.message,
          });
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error syncing all clients:', error);
      throw error;
    }
  }

  /**
   * Update client tokens after refresh
   */
  async updateClientTokens(clientId, tokens) {
    await prisma.mauticClient.update({
      where: { id: clientId },
      data: {
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
        tokenExpiresAt: tokens.tokenExpiresAt,
      },
    });
  }
}

export default new DataSyncService();
