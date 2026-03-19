import { Test, TestingModule } from '@nestjs/testing';
import { OwnerPortalService } from './owner-portal.service';

describe('OwnerPortalService', () => {
  let service: OwnerPortalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnerPortalService],
    }).compile();

    service = module.get<OwnerPortalService>(OwnerPortalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
