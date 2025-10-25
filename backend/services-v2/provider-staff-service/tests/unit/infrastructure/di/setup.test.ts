import { setupDependencies, ServiceTokens } from '@/infrastructure/di/setup';

jest.mock('@supabase/supabase-js', () => {
  const createQueryBuilder = () => {
    const result = { data: null, error: null };
    const builder: any = {};
    builder.select = jest.fn().mockReturnValue(builder);
    builder.eq = jest.fn().mockReturnValue(builder);
    builder.gte = jest.fn().mockReturnValue(builder);
    builder.order = jest.fn().mockReturnValue(builder);
    builder.in = jest.fn().mockReturnValue(builder);
    builder.limit = jest.fn().mockResolvedValue(result);
    builder.range = jest.fn().mockResolvedValue(result);
    builder.single = jest.fn().mockResolvedValue(result);
    builder.insert = jest.fn().mockResolvedValue(result);
    builder.update = jest.fn().mockResolvedValue(result);
    builder.delete = jest.fn().mockResolvedValue(result);
    return builder;
  };

  const clientFactory = () => {
    const builder = createQueryBuilder();
    return {
      from: jest.fn().mockReturnValue(builder),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null })
    };
  };

  return {
    createClient: jest.fn(() => clientFactory())
  };
});

describe('setupDependencies', () => {
  it('đăng ký container với các token quan trọng', () => {
    const container = setupDependencies();

    expect(container).toBeDefined();

    const servicesInfo = container.getServicesInfo();
    expect(servicesInfo.length).toBeGreaterThan(0);

    const tokens = servicesInfo.map((info) => info.token);
    expect(tokens).toContain(ServiceTokens.EVENT_BUS);
    expect(tokens).toContain(ServiceTokens.STAFF_COMMAND_HANDLERS);
    expect(tokens).toContain(ServiceTokens.REGISTER_STAFF_USE_CASE);
  });
});
