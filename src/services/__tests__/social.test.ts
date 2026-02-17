import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lambdaClient } from '@/libs/trpc/client';

import {
  type FavoriteStatus,
  type FollowCounts,
  type FollowStatus,
  type LikeStatus,
  socialService,
  type ToggleLikeResult,
} from '../social';

vi.mock('@/libs/trpc/client', () => ({
  lambdaClient: {
    market: {
      social: {
        follow: { mutate: vi.fn() },
        unfollow: { mutate: vi.fn() },
        checkFollowStatus: { query: vi.fn() },
        getFollowCounts: { query: vi.fn() },
        getFollowing: { query: vi.fn() },
        getFollowers: { query: vi.fn() },
        addFavorite: { mutate: vi.fn() },
        removeFavorite: { mutate: vi.fn() },
        checkFavorite: { query: vi.fn() },
        getMyFavorites: { query: vi.fn() },
        getUserFavoriteAgents: { query: vi.fn() },
        getUserFavoritePlugins: { query: vi.fn() },
        like: { mutate: vi.fn() },
        unlike: { mutate: vi.fn() },
        checkLike: { query: vi.fn() },
        toggleLike: { mutate: vi.fn() },
        getUserLikedAgents: { query: vi.fn() },
        getUserLikedPlugins: { query: vi.fn() },
      },
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SocialService', () => {
  // ==================== Follow ====================

  describe('follow', () => {
    it('should call lambdaClient with followingId', async () => {
      vi.spyOn(lambdaClient.market.social.follow, 'mutate').mockResolvedValue(undefined as any);

      await socialService.follow(42);

      expect(lambdaClient.market.social.follow.mutate).toHaveBeenCalledWith({ followingId: 42 });
    });

    it('should propagate errors from the client', async () => {
      vi.spyOn(lambdaClient.market.social.follow, 'mutate').mockRejectedValue(
        new Error('Network error'),
      );

      await expect(socialService.follow(42)).rejects.toThrow('Network error');
    });
  });

  describe('unfollow', () => {
    it('should call lambdaClient with followingId', async () => {
      vi.spyOn(lambdaClient.market.social.unfollow, 'mutate').mockResolvedValue(undefined as any);

      await socialService.unfollow(99);

      expect(lambdaClient.market.social.unfollow.mutate).toHaveBeenCalledWith({ followingId: 99 });
    });

    it('should propagate errors from the client', async () => {
      vi.spyOn(lambdaClient.market.social.unfollow, 'mutate').mockRejectedValue(
        new Error('Unfollow failed'),
      );

      await expect(socialService.unfollow(99)).rejects.toThrow('Unfollow failed');
    });
  });

  describe('checkFollowStatus', () => {
    it('should return follow status for a user', async () => {
      const mockStatus: FollowStatus = { isFollowing: true, isMutual: false };
      vi.spyOn(lambdaClient.market.social.checkFollowStatus, 'query').mockResolvedValue(
        mockStatus as any,
      );

      const result = await socialService.checkFollowStatus(10);

      expect(lambdaClient.market.social.checkFollowStatus.query).toHaveBeenCalledWith({
        targetUserId: 10,
      });
      expect(result).toEqual(mockStatus);
    });

    it('should return mutual follow status', async () => {
      const mockStatus: FollowStatus = { isFollowing: true, isMutual: true };
      vi.spyOn(lambdaClient.market.social.checkFollowStatus, 'query').mockResolvedValue(
        mockStatus as any,
      );

      const result = await socialService.checkFollowStatus(5);

      expect(result.isMutual).toBe(true);
    });
  });

  describe('getFollowCounts', () => {
    it('should return follow counts for a user', async () => {
      const mockCounts: FollowCounts = { followersCount: 100, followingCount: 50 };
      vi.spyOn(lambdaClient.market.social.getFollowCounts, 'query').mockResolvedValue(
        mockCounts as any,
      );

      const result = await socialService.getFollowCounts(7);

      expect(lambdaClient.market.social.getFollowCounts.query).toHaveBeenCalledWith({
        userId: 7,
      });
      expect(result).toEqual(mockCounts);
    });
  });

  describe('getFollowing', () => {
    const mockPaginatedResponse = {
      currentPage: 1,
      items: [],
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    };

    it('should call query without params when no pagination provided', async () => {
      vi.spyOn(lambdaClient.market.social.getFollowing, 'query').mockResolvedValue(
        mockPaginatedResponse as any,
      );

      await socialService.getFollowing(1);

      expect(lambdaClient.market.social.getFollowing.query).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
        userId: 1,
      });
    });

    it('should calculate offset correctly for page 1', async () => {
      vi.spyOn(lambdaClient.market.social.getFollowing, 'query').mockResolvedValue(
        mockPaginatedResponse as any,
      );

      await socialService.getFollowing(1, { page: 1, pageSize: 20 });

      expect(lambdaClient.market.social.getFollowing.query).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        userId: 1,
      });
    });

    it('should calculate offset correctly for page 2', async () => {
      vi.spyOn(lambdaClient.market.social.getFollowing, 'query').mockResolvedValue(
        mockPaginatedResponse as any,
      );

      await socialService.getFollowing(1, { page: 2, pageSize: 10 });

      expect(lambdaClient.market.social.getFollowing.query).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
        userId: 1,
      });
    });

    it('should calculate offset correctly for page 3 with custom pageSize', async () => {
      vi.spyOn(lambdaClient.market.social.getFollowing, 'query').mockResolvedValue(
        mockPaginatedResponse as any,
      );

      await socialService.getFollowing(1, { page: 3, pageSize: 5 });

      expect(lambdaClient.market.social.getFollowing.query).toHaveBeenCalledWith({
        limit: 5,
        offset: 10,
        userId: 1,
      });
    });

    it('should use default pageSize of 10 when page provided but no pageSize', async () => {
      vi.spyOn(lambdaClient.market.social.getFollowing, 'query').mockResolvedValue(
        mockPaginatedResponse as any,
      );

      await socialService.getFollowing(1, { page: 2 });

      expect(lambdaClient.market.social.getFollowing.query).toHaveBeenCalledWith({
        limit: undefined,
        offset: 10,
        userId: 1,
      });
    });
  });

  describe('getFollowers', () => {
    const mockPaginatedResponse = {
      currentPage: 1,
      items: [],
      pageSize: 10,
      totalCount: 5,
      totalPages: 1,
    };

    it('should call query without params when no pagination provided', async () => {
      vi.spyOn(lambdaClient.market.social.getFollowers, 'query').mockResolvedValue(
        mockPaginatedResponse as any,
      );

      await socialService.getFollowers(2);

      expect(lambdaClient.market.social.getFollowers.query).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
        userId: 2,
      });
    });

    it('should calculate offset correctly for page 2', async () => {
      vi.spyOn(lambdaClient.market.social.getFollowers, 'query').mockResolvedValue(
        mockPaginatedResponse as any,
      );

      await socialService.getFollowers(2, { page: 2, pageSize: 15 });

      expect(lambdaClient.market.social.getFollowers.query).toHaveBeenCalledWith({
        limit: 15,
        offset: 15,
        userId: 2,
      });
    });
  });

  // ==================== Favorite ====================

  describe('addFavorite', () => {
    it('should use targetId when given a numeric identifier', async () => {
      vi.spyOn(lambdaClient.market.social.addFavorite, 'mutate').mockResolvedValue(
        undefined as any,
      );

      await socialService.addFavorite('agent', 123);

      expect(lambdaClient.market.social.addFavorite.mutate).toHaveBeenCalledWith({
        targetId: 123,
        targetType: 'agent',
      });
    });

    it('should use identifier when given a string identifier', async () => {
      vi.spyOn(lambdaClient.market.social.addFavorite, 'mutate').mockResolvedValue(
        undefined as any,
      );

      await socialService.addFavorite('plugin', 'my-plugin-id');

      expect(lambdaClient.market.social.addFavorite.mutate).toHaveBeenCalledWith({
        identifier: 'my-plugin-id',
        targetType: 'plugin',
      });
    });

    it('should work with agent-group targetType', async () => {
      vi.spyOn(lambdaClient.market.social.addFavorite, 'mutate').mockResolvedValue(
        undefined as any,
      );

      await socialService.addFavorite('agent-group', 'group-abc');

      expect(lambdaClient.market.social.addFavorite.mutate).toHaveBeenCalledWith({
        identifier: 'group-abc',
        targetType: 'agent-group',
      });
    });
  });

  describe('removeFavorite', () => {
    it('should use targetId when given a numeric identifier', async () => {
      vi.spyOn(lambdaClient.market.social.removeFavorite, 'mutate').mockResolvedValue(
        undefined as any,
      );

      await socialService.removeFavorite('agent', 456);

      expect(lambdaClient.market.social.removeFavorite.mutate).toHaveBeenCalledWith({
        targetId: 456,
        targetType: 'agent',
      });
    });

    it('should use identifier when given a string identifier', async () => {
      vi.spyOn(lambdaClient.market.social.removeFavorite, 'mutate').mockResolvedValue(
        undefined as any,
      );

      await socialService.removeFavorite('plugin', 'plugin-xyz');

      expect(lambdaClient.market.social.removeFavorite.mutate).toHaveBeenCalledWith({
        identifier: 'plugin-xyz',
        targetType: 'plugin',
      });
    });
  });

  describe('checkFavoriteStatus', () => {
    it('should return favorite status with numeric identifier', async () => {
      const mockStatus: FavoriteStatus = { isFavorited: true };
      vi.spyOn(lambdaClient.market.social.checkFavorite, 'query').mockResolvedValue(
        mockStatus as any,
      );

      const result = await socialService.checkFavoriteStatus('agent', 789);

      expect(lambdaClient.market.social.checkFavorite.query).toHaveBeenCalledWith({
        targetIdOrIdentifier: 789,
        targetType: 'agent',
      });
      expect(result).toEqual(mockStatus);
    });

    it('should return favorite status with string identifier', async () => {
      const mockStatus: FavoriteStatus = { isFavorited: false };
      vi.spyOn(lambdaClient.market.social.checkFavorite, 'query').mockResolvedValue(
        mockStatus as any,
      );

      const result = await socialService.checkFavoriteStatus('plugin', 'my-plugin');

      expect(lambdaClient.market.social.checkFavorite.query).toHaveBeenCalledWith({
        targetIdOrIdentifier: 'my-plugin',
        targetType: 'plugin',
      });
      expect(result.isFavorited).toBe(false);
    });
  });

  describe('getMyFavorites', () => {
    it('should call query without pagination params when none provided', async () => {
      const mockResponse = {
        currentPage: 1,
        items: [],
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      };
      vi.spyOn(lambdaClient.market.social.getMyFavorites, 'query').mockResolvedValue(
        mockResponse as any,
      );

      await socialService.getMyFavorites();

      expect(lambdaClient.market.social.getMyFavorites.query).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
      });
    });

    it('should calculate offset for page 3 with pageSize 5', async () => {
      const mockResponse = {
        currentPage: 3,
        items: [],
        pageSize: 5,
        totalCount: 15,
        totalPages: 3,
      };
      vi.spyOn(lambdaClient.market.social.getMyFavorites, 'query').mockResolvedValue(
        mockResponse as any,
      );

      await socialService.getMyFavorites({ page: 3, pageSize: 5 });

      expect(lambdaClient.market.social.getMyFavorites.query).toHaveBeenCalledWith({
        limit: 5,
        offset: 10,
      });
    });
  });

  describe('getUserFavoriteAgents', () => {
    it('should pass userId and calculate pagination offset', async () => {
      const mockResponse = {
        currentPage: 2,
        items: [],
        pageSize: 10,
        totalCount: 20,
        totalPages: 2,
      };
      vi.spyOn(lambdaClient.market.social.getUserFavoriteAgents, 'query').mockResolvedValue(
        mockResponse as any,
      );

      await socialService.getUserFavoriteAgents(5, { page: 2, pageSize: 10 });

      expect(lambdaClient.market.social.getUserFavoriteAgents.query).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
        userId: 5,
      });
    });
  });

  describe('getUserFavoritePlugins', () => {
    it('should pass userId without pagination when not provided', async () => {
      const mockResponse = {
        currentPage: 1,
        items: [],
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      };
      vi.spyOn(lambdaClient.market.social.getUserFavoritePlugins, 'query').mockResolvedValue(
        mockResponse as any,
      );

      await socialService.getUserFavoritePlugins(3);

      expect(lambdaClient.market.social.getUserFavoritePlugins.query).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
        userId: 3,
      });
    });
  });

  // ==================== Like ====================

  describe('like', () => {
    it('should use targetId when given a numeric identifier', async () => {
      vi.spyOn(lambdaClient.market.social.like, 'mutate').mockResolvedValue(undefined as any);

      await socialService.like('agent', 100);

      expect(lambdaClient.market.social.like.mutate).toHaveBeenCalledWith({
        targetId: 100,
        targetType: 'agent',
      });
    });

    it('should use identifier when given a string identifier', async () => {
      vi.spyOn(lambdaClient.market.social.like, 'mutate').mockResolvedValue(undefined as any);

      await socialService.like('plugin', 'cool-plugin');

      expect(lambdaClient.market.social.like.mutate).toHaveBeenCalledWith({
        identifier: 'cool-plugin',
        targetType: 'plugin',
      });
    });
  });

  describe('unlike', () => {
    it('should use targetId when given a numeric identifier', async () => {
      vi.spyOn(lambdaClient.market.social.unlike, 'mutate').mockResolvedValue(undefined as any);

      await socialService.unlike('agent', 200);

      expect(lambdaClient.market.social.unlike.mutate).toHaveBeenCalledWith({
        targetId: 200,
        targetType: 'agent',
      });
    });

    it('should use identifier when given a string identifier', async () => {
      vi.spyOn(lambdaClient.market.social.unlike, 'mutate').mockResolvedValue(undefined as any);

      await socialService.unlike('agent-group', 'group-id-123');

      expect(lambdaClient.market.social.unlike.mutate).toHaveBeenCalledWith({
        identifier: 'group-id-123',
        targetType: 'agent-group',
      });
    });
  });

  describe('checkLikeStatus', () => {
    it('should return like status for numeric identifier', async () => {
      const mockStatus: LikeStatus = { isLiked: true };
      vi.spyOn(lambdaClient.market.social.checkLike, 'query').mockResolvedValue(mockStatus as any);

      const result = await socialService.checkLikeStatus('agent', 55);

      expect(lambdaClient.market.social.checkLike.query).toHaveBeenCalledWith({
        targetIdOrIdentifier: 55,
        targetType: 'agent',
      });
      expect(result).toEqual(mockStatus);
    });

    it('should return like status for string identifier', async () => {
      const mockStatus: LikeStatus = { isLiked: false };
      vi.spyOn(lambdaClient.market.social.checkLike, 'query').mockResolvedValue(mockStatus as any);

      const result = await socialService.checkLikeStatus('plugin', 'some-plugin');

      expect(result.isLiked).toBe(false);
    });
  });

  describe('toggleLike', () => {
    it('should use targetId when given a numeric identifier and return result', async () => {
      const mockResult: ToggleLikeResult = { liked: true };
      vi.spyOn(lambdaClient.market.social.toggleLike, 'mutate').mockResolvedValue(
        mockResult as any,
      );

      const result = await socialService.toggleLike('agent', 77);

      expect(lambdaClient.market.social.toggleLike.mutate).toHaveBeenCalledWith({
        targetId: 77,
        targetType: 'agent',
      });
      expect(result).toEqual(mockResult);
    });

    it('should use identifier when given a string identifier', async () => {
      const mockResult: ToggleLikeResult = { liked: false };
      vi.spyOn(lambdaClient.market.social.toggleLike, 'mutate').mockResolvedValue(
        mockResult as any,
      );

      const result = await socialService.toggleLike('plugin', 'plugin-toggle');

      expect(lambdaClient.market.social.toggleLike.mutate).toHaveBeenCalledWith({
        identifier: 'plugin-toggle',
        targetType: 'plugin',
      });
      expect(result.liked).toBe(false);
    });
  });

  describe('getUserLikedAgents', () => {
    it('should pass userId and pagination params', async () => {
      const mockResponse = {
        currentPage: 1,
        items: [],
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      };
      vi.spyOn(lambdaClient.market.social.getUserLikedAgents, 'query').mockResolvedValue(
        mockResponse as any,
      );

      await socialService.getUserLikedAgents(8, { page: 1, pageSize: 10 });

      expect(lambdaClient.market.social.getUserLikedAgents.query).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        userId: 8,
      });
    });

    it('should handle no pagination params', async () => {
      const mockResponse = {
        currentPage: 1,
        items: [],
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      };
      vi.spyOn(lambdaClient.market.social.getUserLikedAgents, 'query').mockResolvedValue(
        mockResponse as any,
      );

      await socialService.getUserLikedAgents(8);

      expect(lambdaClient.market.social.getUserLikedAgents.query).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
        userId: 8,
      });
    });
  });

  describe('getUserLikedPlugins', () => {
    it('should pass userId and calculate correct offset for page 4', async () => {
      const mockResponse = {
        currentPage: 4,
        items: [],
        pageSize: 25,
        totalCount: 100,
        totalPages: 4,
      };
      vi.spyOn(lambdaClient.market.social.getUserLikedPlugins, 'query').mockResolvedValue(
        mockResponse as any,
      );

      await socialService.getUserLikedPlugins(9, { page: 4, pageSize: 25 });

      expect(lambdaClient.market.social.getUserLikedPlugins.query).toHaveBeenCalledWith({
        limit: 25,
        offset: 75,
        userId: 9,
      });
    });
  });

  // ==================== Deprecated ====================

  describe('setAccessToken', () => {
    it('should be a no-op and not throw', () => {
      expect(() => socialService.setAccessToken('some-token')).not.toThrow();
      expect(() => socialService.setAccessToken(undefined)).not.toThrow();
    });
  });
});
