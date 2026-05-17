const API = "http://localhost:8000/api";

export const base44 = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API}/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      return res.json();
    },

    me: async () => {
      const res = await fetch(`${API}/me.php`, {
        credentials: "include",
      });
      return res.json();
    },

    logout: async () => {
      await fetch(`${API}/logout.php`, {
        credentials: "include",
      });
      window.location.href = "/login";
    },
  },

  entities: {
    Order: { list: async () => [] },
    Ingredient: { list: async () => [] },
    Reservation: { list: async () => [] },
  },
};
