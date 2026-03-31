require('dotenv').config();
const { Sequelize, Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const config = require('./backend/config/config.json');

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
  host: config.development.host,
  dialect: config.development.dialect,
  logging: false,
});

const Buyer  = require('./backend/models/buyer')(sequelize, Sequelize.DataTypes);
const Seller = require('./backend/models/seller')(sequelize, Sequelize.DataTypes);
const Order  = require('./backend/models/order')(sequelize, Sequelize.DataTypes);
const Dispute = require('./backend/models/dispute')(sequelize, Sequelize.DataTypes);

async function main() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  // Ensure tables exist (safe, no force)
  await sequelize.sync({ force: false, alter: false });
  console.log('✅ Tables synced');

  // ─── 1. Ensure Buyer & Seller exist ────────────────────────────────────────
  const hashedPw = await bcrypt.hash('password', 10);

  let buyer = await Buyer.findOne({ where: { email: 'buyer@example.com' } });
  if (!buyer) {
    buyer = await Buyer.create({
      id: uuidv4(), email: 'buyer@example.com', password: hashedPw,
      firstName: 'John', lastName: 'Doe', phone: '+1 (555) 123-4567',
      country: 'US', isVerified: true, status: 'active'
    });
    console.log('✅ Buyer created: buyer@example.com / password');
  } else {
    console.log('✅ Buyer found:', buyer.email);
  }

  let seller = await Seller.findOne({ where: { email: 'seller@example.com' } });
  if (!seller) {
    seller = await Seller.create({
      id: uuidv4(), email: 'seller@example.com', password: hashedPw,
      firstName: 'Jane', lastName: 'Smith', phone: '+1 (555) 987-6543',
      country: 'US', businessName: "Jane's Design Studio",
      isVerified: true, status: 'active'
    });
    console.log('✅ Seller created: seller@example.com / password');
  } else {
    console.log('✅ Seller found:', seller.email);
  }

  // ─── 2. Clear old mock data ─────────────────────────────────────────────────
  const existingOrders = await Order.findAll({ where: { buyerId: buyer.id, sellerId: seller.id } });
  if (existingOrders.length > 0) {
    const ids = existingOrders.map(o => o.id);
    await Dispute.destroy({ where: { orderId: { [Op.in]: ids } } });
    await Order.destroy({ where: { id: { [Op.in]: ids } } });
    console.log(`🗑️  Cleared ${existingOrders.length} old orders + their disputes`);
  }

  // ─── 3. Create 7 orders covering every status ───────────────────────────────
  const now = Date.now();
  const common = {
    buyerId:           buyer.id,
    sellerId:          seller.id,
    buyerName:         `${buyer.firstName} ${buyer.lastName}`,
    buyerEmail:        buyer.email,
    platform:          'Fiverr',
    productLink:       'https://fiverr.com/jane_smith/logo',
    country:           'US',
    currency:          'USD',
    sellerContact:     seller.email,
    escrowLink:        'http://localhost:5173/seller/order/',
    orderTrackingLink: 'http://localhost:5173/buyer/order/',
    deliveryFiles:     [],
  };

  const ordersData = [
    {
      status: 'PLACED',
      scopeBox: { title: 'Logo Design – Startup', productType: 'Logo design', productLink: 'https://example.com', description: 'Modern logo for a fintech startup. Need vector files and brand guidelines.', deadline: new Date(now + 7*86400000).toISOString(), price: 250 },
      logs: [
        { event: 'ORDER_CREATED', byUserId: buyer.id, timestamp: new Date(now - 1*86400000).toISOString() },
      ]
    },
    {
      status: 'ESCROW_FUNDED',
      scopeBox: { title: 'SaaS Landing Page', productType: 'Website development', productLink: 'https://example.com', description: 'Responsive landing page for SaaS product with animations and contact form.', deadline: new Date(now + 10*86400000).toISOString(), price: 180 },
      logs: [
        { event: 'ORDER_CREATED',  byUserId: buyer.id,  timestamp: new Date(now - 3*86400000).toISOString() },
        { event: 'ESCROW_FUNDED',  byUserId: buyer.id,  timestamp: new Date(now - 2*86400000).toISOString() },
      ]
    },
    {
      status: 'IN_PROGRESS',
      scopeBox: { title: 'Instagram Content Pack (10 posts)', productType: 'Social media post creation', productLink: 'https://example.com', description: '10 branded Instagram posts with captions for fitness brand.', deadline: new Date(now + 5*86400000).toISOString(), price: 120 },
      logs: [
        { event: 'ORDER_CREATED',  byUserId: buyer.id,  timestamp: new Date(now - 5*86400000).toISOString() },
        { event: 'ESCROW_FUNDED',  byUserId: buyer.id,  timestamp: new Date(now - 4*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_IN_PROGRESS', byUserId: seller.id, timestamp: new Date(now - 3*86400000).toISOString() },
      ]
    },
    {
      status: 'SUBMITTED',
      scopeBox: { title: '30-sec Product Ad Video', productType: 'Video editing', productLink: 'https://example.com', description: '30-second promotional video with voiceover and animations.', deadline: new Date(now + 2*86400000).toISOString(), price: 400 },
      deliveryFiles: ['product-video-final.mp4', 'thumbnails.zip'],
      logs: [
        { event: 'ORDER_CREATED',  byUserId: buyer.id,  timestamp: new Date(now - 8*86400000).toISOString() },
        { event: 'ESCROW_FUNDED',  byUserId: buyer.id,  timestamp: new Date(now - 7*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_IN_PROGRESS', byUserId: seller.id, timestamp: new Date(now - 5*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_SUBMITTED',   byUserId: seller.id, timestamp: new Date(now - 1*86400000).toISOString() },
      ]
    },
    {
      status: 'DISPUTED',
      scopeBox: { title: 'NFT Art Collection (5 pieces)', productType: 'NFT art creation', productLink: 'https://example.com', description: '5 unique NFT art pieces in pixel style for Ethereum launch.', deadline: new Date(now - 1*86400000).toISOString(), price: 550 },
      deliveryFiles: ['nft-drafts.zip'],
      logs: [
        { event: 'ORDER_CREATED',  byUserId: buyer.id,  timestamp: new Date(now - 12*86400000).toISOString() },
        { event: 'ESCROW_FUNDED',  byUserId: buyer.id,  timestamp: new Date(now - 11*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_IN_PROGRESS', byUserId: seller.id, timestamp: new Date(now - 9*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_SUBMITTED',   byUserId: seller.id, timestamp: new Date(now - 3*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_DISPUTED',    byUserId: buyer.id,  timestamp: new Date(now - 1*86400000).toISOString() },
      ]
    },
    {
      status: 'DISPUTED',
      scopeBox: { title: 'Brand Identity Package', productType: 'Logo design', productLink: 'https://example.com', description: 'Complete brand identity: logo, colors, fonts, business card, letterhead.', deadline: new Date(now - 3*86400000).toISOString(), price: 890 },
      deliveryFiles: [],
      logs: [
        { event: 'ORDER_CREATED',  byUserId: buyer.id,  timestamp: new Date(now - 20*86400000).toISOString() },
        { event: 'ESCROW_FUNDED',  byUserId: buyer.id,  timestamp: new Date(now - 19*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_IN_PROGRESS', byUserId: seller.id, timestamp: new Date(now - 15*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_DISPUTED',    byUserId: buyer.id,  timestamp: new Date(now - 3*86400000).toISOString() },
      ]
    },
    {
      status: 'COMPLETED',
      scopeBox: { title: 'Mobile App UI Design', productType: 'App development', productLink: 'https://example.com', description: 'Full UI/UX design for iOS fitness app — 12 screens in Figma.', deadline: new Date(now - 5*86400000).toISOString(), price: 320 },
      deliveryFiles: ['app-ui-figma.fig', 'app-assets.zip'],
      logs: [
        { event: 'ORDER_CREATED',  byUserId: buyer.id,  timestamp: new Date(now - 15*86400000).toISOString() },
        { event: 'ESCROW_FUNDED',  byUserId: buyer.id,  timestamp: new Date(now - 14*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_IN_PROGRESS', byUserId: seller.id, timestamp: new Date(now - 10*86400000).toISOString() },
        { event: 'STATUS_CHANGED_TO_SUBMITTED',   byUserId: seller.id, timestamp: new Date(now - 6*86400000).toISOString() },
        { event: 'ORDER_COMPLETED', byUserId: buyer.id, timestamp: new Date(now - 5*86400000).toISOString() },
      ]
    },
  ];

  const createdOrders = [];
  for (const data of ordersData) {
    const { logs, ...rest } = data;
    const id = uuidv4();
    const order = await Order.create({
      ...common, ...rest,
      id,
      escrowLink:        `http://localhost:5173/seller/order/${id}`,
      orderTrackingLink: `http://localhost:5173/buyer/order/${id}`,
      orderLogs: logs,
      deliveryFiles: rest.deliveryFiles || [],
    });
    createdOrders.push(order);
    console.log(`✅ Order [${order.status.padEnd(14)}] $${rest.scopeBox.price} – ${rest.scopeBox.title}`);
  }

  // ─── 4. Create disputes for DISPUTED orders ─────────────────────────────────
  const disputeSeeds = [
    {
      // NFT Art – HIGH risk (after delivery + high value > $300)
      orderIdx: 4,
      reason: 'Quality Issue',
      description: 'The 5 NFT pieces delivered are nothing like the agreed pixel style. They look like low-effort stock images with filters applied. All 5 pieces need to be completely redone from scratch.',
      requestedResolution: 'Full refund of $550 or complete artwork redo within 5 days with daily progress updates.',
      priority: 'HIGH',
      raisedBy: 'buyer',
      timelineExtra: [
        { event: 'EVIDENCE_ADDED', by: 'buyer', timestamp: new Date(now - 12*3600000).toISOString(), description: 'Buyer attached comparison screenshots', notes: '3 files uploaded as evidence' },
      ]
    },
    {
      // Brand Identity – URGENT risk (highest value + deadline passed)
      orderIdx: 5,
      reason: 'Delivery Delay',
      description: 'Seller has gone completely silent after the escrow was funded 3 weeks ago. Zero deliverables submitted. Deadline was 3 days ago. No communication despite multiple follow-ups.',
      requestedResolution: 'Immediate full refund of $890. Seller has breached the contract.',
      priority: 'URGENT',
      raisedBy: 'buyer',
      timelineExtra: []
    },
  ];

  for (const seed of disputeSeeds) {
    const order = createdOrders[seed.orderIdx];
    const existing = await Dispute.findOne({ where: { orderId: order.id } });
    if (existing) { console.log('  (dispute already exists, skipping)'); continue; }

    const createdAt = order.orderLogs[order.orderLogs.length - 1].timestamp;
    await Dispute.create({
      id: uuidv4(),
      orderId:   order.id,
      buyerId:   buyer.id,
      sellerId:  seller.id,
      raisedBy:  seed.raisedBy,
      reason:    seed.reason,
      description: seed.description,
      requestedResolution: seed.requestedResolution,
      priority:  seed.priority,
      status:    'OPEN',
      evidenceUrls: [],
      timeline: [
        {
          event: 'DISPUTE_CREATED',
          by: seed.raisedBy,
          timestamp: createdAt,
          description: `Dispute raised by ${seed.raisedBy}`,
          notes: seed.description.slice(0, 100) + '...'
        },
        ...seed.timelineExtra,
      ],
      lastActivity: new Date(),
    });
    console.log(`🚨 Dispute [${seed.priority.padEnd(6)}] – ${seed.reason} for "${order.scopeBox.title.slice(0,35)}"`);
  }

  // ─── 5. Summary ─────────────────────────────────────────────────────────────
  const totalOrders   = await Order.count();
  const totalDisputes = await Dispute.count();
  const openDisputes  = await Dispute.count({ where: { status: 'OPEN' } });

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log(`📦 Total Orders:   ${totalOrders}`);
  console.log(`⚖️  Total Disputes: ${totalDisputes}  (${openDisputes} open)`);
  console.log('─────────────────────────────────────────');
  console.log('\n🔑 Test Credentials:');
  console.log('  Buyer:  buyer@example.com  / password');
  console.log('  Seller: seller@example.com / password');
  console.log('  Admin:  admin@scrowx.com   / admin123');
  console.log('\n🔗 Test URLs:');
  console.log('  Buyer Dashboard:  http://localhost:5173/buyer/auth');
  console.log('  Seller Dashboard: http://localhost:5173/seller/auth');
  console.log('  Admin Dashboard:  http://localhost:5173/admin/login');
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => sequelize.close());
