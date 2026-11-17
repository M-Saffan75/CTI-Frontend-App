import { canMarkReceived } from '../src/roles/Repairman/features/PartsOrder/utils/parts';
import {
  canReply,
  otherParty,
  raisedByMe,
} from '../src/roles/Repairman/features/Disputes/utils/disputes';
import {
  canDeleteService,
  canEditService,
  canToggleService,
} from '../src/roles/Repairman/features/ServiceCatalog/utils/services';

describe('parts orders', () => {
  test('can be marked received only when delivered and not yet received', () => {
    expect(canMarkReceived({ orderStatus: 'delivered', isReceived: false })).toBe(true);
    expect(canMarkReceived({ orderStatus: 'delivered', isReceived: true })).toBe(false);
    expect(canMarkReceived({ orderStatus: 'shipped', isReceived: false })).toBe(false);
  });
});

describe('disputes', () => {
  const dispute: any = {
    status: 'open',
    raisedBy: { userType: 'customer', userId: { name: 'Customer' } },
    againstUser: { userType: 'repairman', userId: { name: 'Repairman' } },
  };

  test('the other party is always the customer', () => {
    expect(otherParty(dispute).userId?.name).toBe('Customer');
    expect(otherParty({ ...dispute, raisedBy: dispute.againstUser, againstUser: dispute.raisedBy }).userId?.name).toBe('Customer');
  });

  test('knows who raised it', () => {
    expect(raisedByMe(dispute)).toBe(false);
    expect(raisedByMe({ ...dispute, raisedBy: { userType: 'repairman' } })).toBe(true);
  });

  test('a resolved or closed dispute cannot be replied to', () => {
    expect(canReply({ status: 'open' })).toBe(true);
    expect(canReply({ status: 'under_review' })).toBe(true);
    expect(canReply({ status: 'resolved' })).toBe(false);
    expect(canReply({ status: 'closed' })).toBe(false);
  });
});

describe('service catalog rules', () => {
  test('an approved service can only be switched on or off', () => {
    expect(canToggleService({ status: 'approved' })).toBe(true);
    expect(canEditService({ status: 'approved' })).toBe(false);
    expect(canDeleteService({ status: 'approved' })).toBe(false);
  });

  test('a pending or rejected service can be edited and deleted but not switched', () => {
    for (const status of ['pending', 'rejected'] as const) {
      expect(canEditService({ status })).toBe(true);
      expect(canDeleteService({ status })).toBe(true);
      expect(canToggleService({ status })).toBe(false);
    }
  });
});
