export type UserWithLists = {
  id: string;
  name: string;
  lists: {
    id: string;
    items: {
      id: string;
      title: string;
      purchased: boolean;
      purchasedBy: string | null;
    }[];
  }[];
};