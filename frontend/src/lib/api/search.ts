import { ApiClient } from './client';
import { PostItemSchema, type PostItem } from './schemas/posts';

export interface SearchParams {
  query: string;
  username?: string;
  lang?: string;
}

export const SearchApi = {
  searchPostsSemantic: async (params: SearchParams): Promise<PostItem[]> => {
    const query = new URLSearchParams();
    query.set('query', params.query);
    if (params.username) query.set('username', params.username);
    if (params.lang) query.set('lang', params.lang);
    
    const data = await ApiClient.get<PostItem[]>(`/api/forum/search/semantic?${query.toString()}`);
    data.forEach(item => PostItemSchema.parse(item));
    return data;
  },
};