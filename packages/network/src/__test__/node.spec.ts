import type { ClientBroadcast } from '../api/client'
import type { NodeFactory, WorkspaceFactory, Workspace } from '../api/node'
import type { Request, ResponseValue } from '../api/request'
import type { AccountUuid, NodeUuid, WorkspaceUuid } from '../api/types'
import { StaticNodeDiscovery, StaticWorkspaceDiscovery } from '../discovery/static'
import { NodeImpl } from '../worker/node'
import { SessionManagerImpl } from '../worker/session'
import { NodeManagerImpl } from '../worker/node'

const workspaces = {
  ws1: 'ws1' as WorkspaceUuid,
  ws2: 'ws2' as WorkspaceUuid,
  ws3: 'ws3' as WorkspaceUuid,
  ws4: 'ws4' as WorkspaceUuid,
  ws5: 'ws5' as WorkspaceUuid,
  ws6: 'ws6' as WorkspaceUuid,
  ws7: 'ws7' as WorkspaceUuid,
  ws8: 'ws8' as WorkspaceUuid,
  ws9: 'ws9' as WorkspaceUuid,
  ws10: 'ws10' as WorkspaceUuid
}

const users = {
  user1: 'user1' as AccountUuid,
  user2: 'user2' as AccountUuid
}

const nodes = {
  node1: 'node1' as NodeUuid,
  node2: 'node2' as NodeUuid,
  node3: 'node3' as NodeUuid,
  node4: 'node4' as NodeUuid,
  node5: 'node5' as NodeUuid
}

class DummyWorkspace implements Workspace {
  _id: WorkspaceUuid
  lastUse: number

  constructor (id: WorkspaceUuid) {
    this._id = id
    this.lastUse = Date.now()
  }

  async ask<T, V>(req: Request<T>): Promise<ResponseValue<V>> {
    return { value: [`hello from ${this._id}` as V], total: 1 }
  }

  async modify (req: Request<any>): Promise<ResponseValue<any>> {
    return { value: ['done', this._id], total: 0 }
  }

  ping () {
    this.lastUse = Date.now()
  }

  async close () {}
}

describe('node-ask', () => {
  it('check workspace is accessible', async () => {
    const simpleDiscovery = new StaticNodeDiscovery([
      [nodes.node1, {}],
      [nodes.node2, {}],
      [nodes.node3, {}],
      [nodes.node4, {}],
      [nodes.node5, {}]
    ])

    const wsDiscovery = new StaticWorkspaceDiscovery({
      [users.user1]: [workspaces.ws1, workspaces.ws2, workspaces.ws3],
      [users.user2]: [workspaces.ws4, workspaces.ws5, workspaces.ws6],
      [workspaces.ws1]: [workspaces.ws7, workspaces.ws8],
      [workspaces.ws8]: [workspaces.ws9, workspaces.ws10]
    })
    const wsFactory: WorkspaceFactory = async (workspaceId) => new DummyWorkspace(workspaceId)

    let clientBroadcast: ClientBroadcast | undefined

    const workerFactory: NodeFactory = async (nodeId) => {
      return new NodeImpl(nodeId, wsFactory, wsDiscovery, manager, {
        broadcast: async (account, response) => {
          clientBroadcast?.broadcast(account, response)
        }
      })
    }

    const manager = new NodeManagerImpl(workerFactory, simpleDiscovery)

    const localNode = await manager.node(nodes.node1)

    const clientManager = new SessionManagerImpl(
      (broadcast) => {
        clientBroadcast = broadcast
        return localNode
      },
      (op) => {}
    )

    const client1 = await clientManager.register(users.user1, 's1')

    const helloResp = await client1.ask('hello')

    expect(helloResp.value).toEqual(['hello from ' + workspaces.ws1])
  })
})
