import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/dashboard/:clientId - Get dashboard overview
 */
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const clientIdInt = parseInt(clientId);

    // Get client info
    const client = await prisma.mauticClient.findUnique({
      where: { id: clientIdInt },
      select: {
        id: true,
        clientName: true,
        baseUrl: true,
        lastSyncAt: true,
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Get total counts
    const totalContacts = await prisma.contact.count({
      where: { clientId: clientIdInt },
    });

    const totalCampaigns = await prisma.campaign.count({
      where: { clientId: clientIdInt },
    });

    const totalEmails = await prisma.emailStat.count({
      where: { clientId: clientIdInt },
    });

    const totalSegments = await prisma.segment.count({
      where: { clientId: clientIdInt },
    });

    const emailStats = await prisma.emailStat.aggregate({
      where: { clientId: clientIdInt },
      _sum: {
        sentCount: true,
        readCount: true,
        clickedCount: true,
        failedCount: true,
      },
      _avg: {
        openRate: true,
        clickRate: true,
      },
    });

    // Get recent contacts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentContactsCount = await prisma.contact.count({
      where: {
        clientId: clientIdInt,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get contact growth over last 30 days
    const contactGrowth = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date, 
        COUNT(*) as count
      FROM contacts
      WHERE clientId = ${clientIdInt}
        AND createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
    `;

    // Get top campaigns by contacts
    const topCampaigns = await prisma.campaign.findMany({
      where: { clientId: clientIdInt },
      orderBy: { totalContacts: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        totalContacts: true,
        isPublished: true,
      },
    });

    // Get top emails by open rate
    const topEmails = await prisma.emailStat.findMany({
      where: { 
        clientId: clientIdInt,
        sentCount: { gt: 0 },
      },
      orderBy: { openRate: 'desc' },
      take: 5,
      select: {
        id: true,
        subject: true,
        name: true,
        sentCount: true,
        readCount: true,
        openRate: true,
        clickRate: true,
      },
    });

    res.json({
      success: true,
      client,
      summary: {
        totalContacts,
        totalCampaigns,
        totalSegments,
        totalEmails,
        totalEmailsSent: emailStats._sum.sentCount || 0,
        totalEmailsOpened: emailStats._sum.readCount || 0,
        totalEmailsClicked: emailStats._sum.clickedCount || 0,
        totalEmailsFailed: emailStats._sum.failedCount || 0,
        avgOpenRate: parseFloat((emailStats._avg.openRate || 0).toFixed(2)),
        avgClickRate: parseFloat((emailStats._avg.clickRate || 0).toFixed(2)),
        recentContactsCount,
      },
      charts: {
        contactGrowth: contactGrowth.map(row => ({
          date: row.date,
          count: Number(row.count),
        })),
      },
      topCampaigns,
      topEmails,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/:clientId/contacts - Get contacts list
 */
router.get('/:clientId/contacts', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 50, search = '' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const clientIdInt = parseInt(clientId);

    const where = {
      clientId: clientIdInt,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          mauticContactId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          city: true,
          country: true,
          points: true,
          lastActive: true,
          createdAt: true,
        },
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      success: true,
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/:clientId/campaigns - Get campaigns list with email stats
 */
router.get('/:clientId/campaigns', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const clientIdInt = parseInt(clientId);

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: { clientId: clientIdInt },
        skip,
        take: parseInt(limit),
        orderBy: { totalContacts: 'desc' },
        select: {
          id: true,
          mauticCampaignId: true,
          name: true,
          description: true,
          isPublished: true,
          totalContacts: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.campaign.count({
        where: { clientId: clientIdInt },
      }),
    ]);

    res.json({
      success: true,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/:clientId/emails - Get email stats
 */
router.get('/:clientId/emails', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const clientIdInt = parseInt(clientId);

    const [emails, total] = await Promise.all([
      prisma.emailStat.findMany({
        where: { clientId: clientIdInt },
        skip,
        take: parseInt(limit),
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          mauticEmailId: true,
          name: true,
          subject: true,
          sentCount: true,
          readCount: true,
          clickedCount: true,
          failedCount: true,
          openRate: true,
          clickRate: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      prisma.emailStat.count({
        where: { clientId: clientIdInt },
      }),
    ]);

    res.json({
      success: true,
      emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email stats',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/:clientId/segments - Get segments
 */
router.get('/:clientId/segments', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const clientIdInt = parseInt(clientId);

    const [segments, total] = await Promise.all([
      prisma.segment.findMany({
        where: { clientId: clientIdInt },
        skip,
        take: parseInt(limit),
        orderBy: { contactCount: 'desc' },
        select: {
          id: true,
          mauticSegmentId: true,
          name: true,
          description: true,
          isPublished: true,
          isGlobal: true,
          contactCount: true,
          createdBy: true,
          dateAdded: true,
          dateModified: true,
          createdAt: true,
        },
      }),
      prisma.segment.count({
        where: { clientId: clientIdInt },
      }),
    ]);

    res.json({
      success: true,
      segments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch segments',
      error: error.message,
    });
  }
});

export default router;
