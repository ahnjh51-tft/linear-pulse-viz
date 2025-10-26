import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'https://api.linear.app/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('linear_api_key');
  return {
    headers: {
      ...headers,
      authorization: token ? `${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export const createApolloClientWithKey = (apiKey: string) => {
  const httpLink = createHttpLink({
    uri: 'https://api.linear.app/graphql',
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: apiKey,
      },
    };
  });

  return new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache(),
  });
};
