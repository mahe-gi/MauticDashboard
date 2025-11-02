import express from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption.js';
import MauticAPIClient from '../services/mauticAPI.js';
import dataSyncService from '../services/dataSync.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/client/list - Get all clients
 */
router.get('/list', async (req, res) => {
  try {
    const clients = await prisma.mauticClient.findMany({
      select: {
        id: true,
        clientName: true,
        baseUrl: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
        accessToken: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add hasToken flag and remove actual token from response
    const clientsWithStatus = clients.map(client => ({
      ...client,
      hasToken: !!client.accessToken,
      accessToken: undefined, // Remove token from response
    }));

    res.json({
      success: true,
      clients: clientsWithStatus,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error.message,
    });
  }
});

/**
 * GET /api/client/:id - Get single client details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await prisma.mauticClient.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        clientName: true,
        baseUrl: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    res.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client',
      error: error.message,
    });
  }
});

/**
 * POST /api/client/add - Add new Mautic client
 */
router.post('/add', async (req, res) => {
  try {
    const { clientName, baseUrl, clientId, clientSecret, username, password } = req.body;

    // Validate required fields
    if (!clientName || !baseUrl || !clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientName, baseUrl, clientId, clientSecret',
      });
    }

    // Create temporary API client to get initial token
    const tempClient = {
      baseUrl,
      clientId: encrypt(clientId),
      clientSecret: encrypt(clientSecret),
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
    };

    const mauticAPI = new MauticAPIClient(tempClient);

    // Get initial token if username and password provided
    let tokens = null;
    if (username && password) {
      try {
        tokens = await mauticAPI.getInitialToken(username, password);
      } catch (error) {
        console.error('Mautic authentication error:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to authenticate with Mautic. Please verify your credentials and ensure your Mautic instance is accessible.',
          details: error.response?.data || error.message,
          hint: 'Check that: 1) Base URL is correct, 2) OAuth credentials are valid, 3) Username/password are correct, 4) Mautic instance is online',
        });
      }
    }

    // Save client to database
    const newClient = await prisma.mauticClient.create({
      data: {
        clientName,
        baseUrl: baseUrl.replace(/\/$/, ''),
        clientId: encrypt(clientId),
        clientSecret: encrypt(clientSecret),
        accessToken: tokens?.accessToken ? encrypt(tokens.accessToken) : null,
        refreshToken: tokens?.refreshToken ? encrypt(tokens.refreshToken) : null,
        tokenExpiresAt: tokens?.tokenExpiresAt || null,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'Client added successfully',
      client: {
        id: newClient.id,
        clientName: newClient.clientName,
        baseUrl: newClient.baseUrl,
        isActive: newClient.isActive,
        createdAt: newClient.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add client',
      error: error.message,
    });
  }
});

/**
 * PUT /api/client/:id - Update client
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, baseUrl, clientId, clientSecret, isActive } = req.body;

    const updateData = {};
    if (clientName) updateData.clientName = clientName;
    if (baseUrl) updateData.baseUrl = baseUrl.replace(/\/$/, '');
    if (clientId) updateData.clientId = encrypt(clientId);
    if (clientSecret) updateData.clientSecret = encrypt(clientSecret);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedClient = await prisma.mauticClient.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Client updated successfully',
      client: {
        id: updatedClient.id,
        clientName: updatedClient.clientName,
        baseUrl: updatedClient.baseUrl,
        isActive: updatedClient.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/client/:id - Delete client
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.mauticClient.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error.message,
    });
  }
});

/**
 * POST /api/client/:id/test - Test connection to Mautic
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;

    const client = await prisma.mauticClient.findUnique({
      where: { id: parseInt(id) },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    const mauticAPI = new MauticAPIClient(client);
    const result = await mauticAPI.testConnection();

    res.json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
    });
  }
});

/**
 * POST /api/client/:id/sync - Manually sync data for a client
 */
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if client exists and has valid token
    const client = await prisma.mauticClient.findUnique({
      where: { id: parseInt(id) },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    if (!client.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No access token available for this client. Please authenticate first by providing username/password when adding the client, or manually update the token.',
        hint: 'You can delete and re-add this client with username/password to get a token automatically.',
      });
    }

    const result = await dataSyncService.syncAllData(parseInt(id));

    res.json({
      success: true,
      message: 'Data synced successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('No access token')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        hint: 'Delete and re-add this client with username/password to authenticate.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to sync data',
      error: error.message,
    });
  }
});

/**
 * POST /api/client/:id/token - Update tokens manually
 */
router.post('/:id/token', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const client = await prisma.mauticClient.findUnique({
      where: { id: parseInt(id) },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    const mauticAPI = new MauticAPIClient(client);
    const tokens = await mauticAPI.getInitialToken(username, password);

    await prisma.mauticClient.update({
      where: { id: parseInt(id) },
      data: {
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        tokenExpiresAt: tokens.tokenExpiresAt,
      },
    });

    res.json({
      success: true,
      message: 'Tokens updated successfully',
    });
  } catch (error) {
    console.error('Error updating tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tokens',
      error: error.message,
    });
  }
});

export default router;
