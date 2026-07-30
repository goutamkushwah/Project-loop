import "server-only";

type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
};

class FakeDB {
  user = {
    async findUnique({
      where,
    }: {
      where: { email: string };
    }): Promise<User | null> {
      return null;
    },

    async create({
      data,
    }: {
      data: {
        name: string;
        email: string;
        password: string;
      };
    }): Promise<User> {
      return {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
      };
    },
  };
}

export const db = new FakeDB();