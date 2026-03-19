import { Test, TestingModule } from '@nestjs/testing';
import { OwnerPortalController } from './owner-portal.controller';

describe('OwnerPortalController', () => {
  let controller: OwnerPortalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OwnerPortalController],
    }).compile();

    controller = module.get<OwnerPortalController>(OwnerPortalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
