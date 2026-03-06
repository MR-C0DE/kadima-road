import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  intervention: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention',
    required: true
  },
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Helper'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'CAD'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'wallet', 'insurance'],
    required: true
  },
  stripeDetails: {
    paymentIntentId: String,
    clientSecret: String,
    chargeId: String,
    refundId: String,
    receiptUrl: String
  },
  breakdown: {
    subtotal: Number,
    serviceFee: Number,
    tax: Number,
    tip: Number,
    total: Number
  },
  fees: {
    platformFee: Number,
    helperEarnings: Number,
    taxAmount: Number
  },
  transactions: [{
    type: { type: String, enum: ['charge', 'refund', 'payout'] },
    amount: Number,
    status: String,
    stripeId: String,
    timestamp: { type: Date, default: Date.now }
  }],
  refund: {
    isRefunded: { type: Boolean, default: false },
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundId: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ intervention: 1 }, { unique: true });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;