import type { NodeDiscovery } from './discovery'
import type { AskOptions, Request, RequestAkn, Response, ResponseValue } from './request'
import type { AccountUuid, NodeUuid, WorkspaceUuid } from './types'

export interface Node {
  _id: NodeUuid

  ask: <T, V>(req: Request<T>, options?: AskOptions) => Promise<RequestAkn>

  modify: <T, V>(workspaceId: WorkspaceUuid, req: Request<T>) => Promise<ResponseValue<V>>

  ping: (accounts: AccountUuid[]) => Promise<void>

  /**
   * Inform all clients about some request/Response
   */
  broadcast: <T>(req: Array<Response<T>>) => Promise<void>

  close: () => Promise<void>
}

export interface NodeManager extends NodeDiscovery {
  node: (node: NodeUuid) => Promise<Node>
}

export type NodeFactory = (node: NodeUuid) => Promise<Node>

export interface Workspace {
  _id: WorkspaceUuid

  lastUse: number // Timestamp of the last use

  ask: <T, V>(req: Request<T>) => Promise<ResponseValue<V>>

  modify: <T, V>(req: Request<T>) => Promise<ResponseValue<V>>

  ping: () => void // Keep workspace up to date, and do not shut it down until client is off.

  close: () => Promise<void>
}

export type WorkspaceFactory = (workspaceId: WorkspaceUuid) => Promise<Workspace>
