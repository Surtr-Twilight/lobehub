// @vitest-environment node
import { DEFAULT_AGENT_CONFIG, DEFAULT_CHAT_GROUP_CHAT_CONFIG } from '@lobechat/const';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentModel } from '@/database/models/agent';
import { ChatGroupModel } from '@/database/models/chatGroup';
import { AgentGroupRepository } from '@/database/repositories/agentGroup';

import { AgentGroupService } from './index';

vi.mock('@/database/models/agent', () => ({
  AgentModel: vi.fn(),
}));

vi.mock('@/database/models/chatGroup', () => ({
  ChatGroupModel: vi.fn(),
}));

vi.mock('@/database/repositories/agentGroup', () => ({
  AgentGroupRepository: vi.fn(),
}));

vi.mock('@/server/globalConfig', () => ({
  getServerDefaultAgentConfig: vi.fn().mockReturnValue({}),
}));

describe('AgentGroupService', () => {
  let service: AgentGroupService;
  const mockDb = {} as any;
  const mockUserId = 'test-user-id';

  let mockAgentModel: { batchDelete: ReturnType<typeof vi.fn> };
  let mockChatGroupModel: {
    queryWithMemberDetails: ReturnType<typeof vi.fn>;
    getGroupAgents: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockAgentGroupRepo: {
    findByIdWithAgents: ReturnType<typeof vi.fn>;
    checkAgentsBeforeRemoval: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAgentModel = {
      batchDelete: vi.fn().mockResolvedValue(undefined),
    };
    mockChatGroupModel = {
      queryWithMemberDetails: vi.fn().mockResolvedValue([]),
      getGroupAgents: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue({ id: 'group-1' }),
    };
    mockAgentGroupRepo = {
      findByIdWithAgents: vi.fn().mockResolvedValue(null),
      checkAgentsBeforeRemoval: vi
        .fn()
        .mockResolvedValue({ virtualAgents: [], nonVirtualAgentIds: [] }),
    };

    (AgentModel as any).mockImplementation(() => mockAgentModel);
    (ChatGroupModel as any).mockImplementation(() => mockChatGroupModel);
    (AgentGroupRepository as any).mockImplementation(() => mockAgentGroupRepo);

    service = new AgentGroupService(mockDb, mockUserId);
  });

  describe('getGroupDetail', () => {
    it('should delegate to agentGroupRepo.findByIdWithAgents', async () => {
      const groupDetail = { id: 'group-1', agents: [] };
      mockAgentGroupRepo.findByIdWithAgents.mockResolvedValue(groupDetail);

      const result = await service.getGroupDetail('group-1');

      expect(mockAgentGroupRepo.findByIdWithAgents).toHaveBeenCalledWith('group-1');
      expect(result).toEqual(groupDetail);
    });

    it('should return null when group does not exist', async () => {
      mockAgentGroupRepo.findByIdWithAgents.mockResolvedValue(null);

      const result = await service.getGroupDetail('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getGroups', () => {
    it('should delegate to chatGroupModel.queryWithMemberDetails', async () => {
      const groups = [{ id: 'group-1', members: [] }];
      mockChatGroupModel.queryWithMemberDetails.mockResolvedValue(groups);

      const result = await service.getGroups();

      expect(mockChatGroupModel.queryWithMemberDetails).toHaveBeenCalled();
      expect(result).toEqual(groups);
    });

    it('should return empty array when no groups exist', async () => {
      mockChatGroupModel.queryWithMemberDetails.mockResolvedValue([]);

      const result = await service.getGroups();

      expect(result).toEqual([]);
    });
  });

  describe('deleteGroup', () => {
    it('should delete group and return result with no virtual agents', async () => {
      const groupId = 'group-1';
      const groupAgents = [{ agentId: 'agent-1' }, { agentId: 'agent-2' }];
      const deletedGroup = { id: groupId };

      mockChatGroupModel.getGroupAgents.mockResolvedValue(groupAgents);
      mockAgentGroupRepo.checkAgentsBeforeRemoval.mockResolvedValue({
        nonVirtualAgentIds: ['agent-1', 'agent-2'],
        virtualAgents: [],
      });
      mockChatGroupModel.delete.mockResolvedValue(deletedGroup);

      const result = await service.deleteGroup(groupId);

      expect(mockChatGroupModel.getGroupAgents).toHaveBeenCalledWith(groupId);
      expect(mockAgentGroupRepo.checkAgentsBeforeRemoval).toHaveBeenCalledWith(groupId, [
        'agent-1',
        'agent-2',
      ]);
      expect(mockChatGroupModel.delete).toHaveBeenCalledWith(groupId);
      expect(mockAgentModel.batchDelete).not.toHaveBeenCalled();
      expect(result).toEqual({
        deletedVirtualAgentIds: [],
        group: deletedGroup,
      });
    });

    it('should delete virtual agents when group has virtual members', async () => {
      const groupId = 'group-2';
      const groupAgents = [{ agentId: 'agent-1' }, { agentId: 'virtual-agent-1' }];
      const deletedGroup = { id: groupId };
      const virtualAgents = [
        { id: 'virtual-agent-1', title: 'Virtual', avatar: null, description: '' },
      ];

      mockChatGroupModel.getGroupAgents.mockResolvedValue(groupAgents);
      mockAgentGroupRepo.checkAgentsBeforeRemoval.mockResolvedValue({
        nonVirtualAgentIds: ['agent-1'],
        virtualAgents,
      });
      mockChatGroupModel.delete.mockResolvedValue(deletedGroup);

      const result = await service.deleteGroup(groupId);

      expect(mockAgentModel.batchDelete).toHaveBeenCalledWith(['virtual-agent-1']);
      expect(result).toEqual({
        deletedVirtualAgentIds: ['virtual-agent-1'],
        group: deletedGroup,
      });
    });

    it('should handle empty group with no agents', async () => {
      const groupId = 'empty-group';
      const deletedGroup = { id: groupId };

      mockChatGroupModel.getGroupAgents.mockResolvedValue([]);
      mockAgentGroupRepo.checkAgentsBeforeRemoval.mockResolvedValue({
        nonVirtualAgentIds: [],
        virtualAgents: [],
      });
      mockChatGroupModel.delete.mockResolvedValue(deletedGroup);

      const result = await service.deleteGroup(groupId);

      expect(mockAgentModel.batchDelete).not.toHaveBeenCalled();
      expect(result).toEqual({
        deletedVirtualAgentIds: [],
        group: deletedGroup,
      });
    });

    it('should delete all virtual agents when all members are virtual', async () => {
      const groupId = 'all-virtual-group';
      const groupAgents = [{ agentId: 'v-agent-1' }, { agentId: 'v-agent-2' }];
      const deletedGroup = { id: groupId };
      const virtualAgents = [
        { id: 'v-agent-1', title: 'V1', avatar: null, description: '' },
        { id: 'v-agent-2', title: 'V2', avatar: null, description: '' },
      ];

      mockChatGroupModel.getGroupAgents.mockResolvedValue(groupAgents);
      mockAgentGroupRepo.checkAgentsBeforeRemoval.mockResolvedValue({
        nonVirtualAgentIds: [],
        virtualAgents,
      });
      mockChatGroupModel.delete.mockResolvedValue(deletedGroup);

      const result = await service.deleteGroup(groupId);

      expect(mockAgentModel.batchDelete).toHaveBeenCalledWith(['v-agent-1', 'v-agent-2']);
      expect(result.deletedVirtualAgentIds).toEqual(['v-agent-1', 'v-agent-2']);
    });
  });

  describe('normalizeGroupConfig', () => {
    it('should return undefined when config is null', () => {
      const result = service.normalizeGroupConfig(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined when config is undefined', () => {
      const result = service.normalizeGroupConfig(undefined);
      expect(result).toBeUndefined();
    });

    it('should merge with DEFAULT_CHAT_GROUP_CHAT_CONFIG when config is provided', () => {
      const config = { allowDM: false, systemPrompt: 'custom prompt' };

      const result = service.normalizeGroupConfig(config as any);

      expect(result).toEqual({
        ...DEFAULT_CHAT_GROUP_CHAT_CONFIG,
        ...config,
      });
    });

    it('should override default values with provided config', () => {
      const config = {
        allowDM: false,
        openingMessage: 'Welcome!',
        openingQuestions: ['Q1?', 'Q2?'],
        revealDM: true,
        systemPrompt: 'Custom prompt',
      };

      const result = service.normalizeGroupConfig(config);

      expect(result?.allowDM).toBe(false);
      expect(result?.openingMessage).toBe('Welcome!');
      expect(result?.openingQuestions).toEqual(['Q1?', 'Q2?']);
      expect(result?.revealDM).toBe(true);
      expect(result?.systemPrompt).toBe('Custom prompt');
    });

    it('should keep DEFAULT_CHAT_GROUP_CHAT_CONFIG values for missing keys', () => {
      const config = { allowDM: false } as any;

      const result = service.normalizeGroupConfig(config);

      // Defaults from DEFAULT_CHAT_GROUP_CHAT_CONFIG
      expect(result?.openingMessage).toBe(DEFAULT_CHAT_GROUP_CHAT_CONFIG.openingMessage);
      expect(result?.openingQuestions).toEqual(DEFAULT_CHAT_GROUP_CHAT_CONFIG.openingQuestions);
      expect(result?.revealDM).toBe(DEFAULT_CHAT_GROUP_CHAT_CONFIG.revealDM);
      expect(result?.systemPrompt).toBe(DEFAULT_CHAT_GROUP_CHAT_CONFIG.systemPrompt);
    });
  });

  describe('mergeAgentsDefaultConfig', () => {
    it('should merge DEFAULT_AGENT_CONFIG as the base for all agents', () => {
      const defaultAgentConfig = {} as any;
      const agents = [{ id: 'a1', title: 'Agent 1' }];

      const result = service.mergeAgentsDefaultConfig(defaultAgentConfig, agents);

      expect(result).toHaveLength(1);
      // The result should include DEFAULT_AGENT_CONFIG fields
      expect(result[0]).toMatchObject({
        id: 'a1',
        title: 'Agent 1',
      });
    });

    it('should apply user default agent config over DEFAULT_AGENT_CONFIG', () => {
      const userDefaultConfig = { config: { model: 'user-model', provider: 'user-provider' } };
      const agents = [{ id: 'a1' }];

      const result = service.mergeAgentsDefaultConfig(userDefaultConfig as any, agents);

      expect(result[0]).toMatchObject({
        model: 'user-model',
        provider: 'user-provider',
      });
    });

    it('should let agent-specific config override user default config', () => {
      const userDefaultConfig = { config: { model: 'user-model', provider: 'user-provider' } };
      const agents = [{ id: 'a1', model: 'agent-model', provider: 'agent-provider' }];

      const result = service.mergeAgentsDefaultConfig(userDefaultConfig as any, agents);

      expect(result[0]).toMatchObject({
        model: 'agent-model',
        provider: 'agent-provider',
      });
    });

    it('should handle multiple agents independently', () => {
      const defaultAgentConfig = { config: { model: 'default-model' } };
      const agents = [
        { id: 'a1', model: 'model-a1' },
        { id: 'a2' }, // no model, should use default
        { id: 'a3', model: 'model-a3' },
      ];

      const result = service.mergeAgentsDefaultConfig(defaultAgentConfig as any, agents);

      expect(result).toHaveLength(3);
      expect(result[0].model).toBe('model-a1');
      expect(result[1].model).toBe('default-model');
      expect(result[2].model).toBe('model-a3');
    });

    it('should handle empty agents array', () => {
      const defaultAgentConfig = {} as any;

      const result = service.mergeAgentsDefaultConfig(defaultAgentConfig, []);

      expect(result).toEqual([]);
    });

    it('should handle defaultAgentConfig without config property', () => {
      // When defaultAgentConfig has no config property
      const defaultAgentConfig = {} as any;
      const agents = [{ id: 'a1' }];

      const result = service.mergeAgentsDefaultConfig(defaultAgentConfig, agents);

      // Should still merge DEFAULT_AGENT_CONFIG as base
      expect(result[0]).toMatchObject({
        id: 'a1',
        model: DEFAULT_AGENT_CONFIG.model,
      });
    });

    it('should apply server default agent config between DEFAULT_AGENT_CONFIG and user config', async () => {
      const { getServerDefaultAgentConfig } = await import('@/server/globalConfig');
      vi.mocked(getServerDefaultAgentConfig).mockReturnValue({
        model: 'server-model',
        provider: 'server-provider',
      } as any);

      // User config overrides server config
      const userDefaultConfig = { config: { model: 'user-model' } };
      const agents = [{ id: 'a1' }];

      const result = service.mergeAgentsDefaultConfig(userDefaultConfig as any, agents);

      // User config wins over server config
      expect(result[0].model).toBe('user-model');
    });

    it('should preserve extra properties in agents beyond standard config', () => {
      const defaultAgentConfig = {} as any;
      const agents = [{ id: 'a1', customProp: 'custom-value', title: 'My Agent' }];

      const result = service.mergeAgentsDefaultConfig(defaultAgentConfig, agents);

      expect(result[0]).toMatchObject({
        customProp: 'custom-value',
        id: 'a1',
        title: 'My Agent',
      });
    });
  });
});
