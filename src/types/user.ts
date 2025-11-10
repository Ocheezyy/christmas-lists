import { Item, List, User } from '@/generated/prisma/client';

export type UserWithLists = Pick<User, 'id' | 'name'> & {
  lists: (Pick<List, 'id'> & {
    items: Pick<Item, 'id' | 'title' | 'purchased' | 'purchasedBy'>[];
  })[];
};