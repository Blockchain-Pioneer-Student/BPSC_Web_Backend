import { EventsService } from './events.service';

describe('EventsService.createEvent', () => {
  const uploadService = {} as any;

  it('creates a unique slug from the title and date when none is provided', async () => {
    const eventsRepository = {
      findEventBySlug: jest.fn().mockResolvedValue(null),
      createEvent: jest.fn().mockImplementation(async (event) => event),
    };
    const service = new EventsService(eventsRepository as any, uploadService);

    const created = await service.createEvent({
      title: 'Giới thiệu Blockchain',
      date: '2026-11-11',
    });

    expect(created.slug).toBe('gioi-thieu-blockchain-2026-11-11');
  });

  it('adds a suffix when the generated slug already exists', async () => {
    const eventsRepository = {
      findEventBySlug: jest.fn()
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(null),
      createEvent: jest.fn().mockImplementation(async (event) => event),
    };
    const service = new EventsService(eventsRepository as any, uploadService);

    const created = await service.createEvent({
      title: 'Workshop Blockchain',
      date: '2026-11-11',
    });

    expect(created.slug).toBe('workshop-blockchain-2026-11-11-2');
  });
});
