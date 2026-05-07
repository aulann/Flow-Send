import type * as Party from "partykit/server"

export default class Server implements Party.Server {
  private peers = new Set<string>()

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    if (this.peers.size >= 2) {
      conn.send(JSON.stringify({ type: "room-full" }))
      conn.close()
      return
    }

    this.peers.add(conn.id)

    if (this.peers.size === 2) {
      // Second peer joined — tell the first peer to send its SDP offer
      this.room.broadcast(JSON.stringify({ type: "peer-joined" }), [conn.id])
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    // Relay all signaling messages to the other peer
    this.room.broadcast(message, [sender.id])
  }

  onClose(conn: Party.Connection) {
    this.peers.delete(conn.id)
    this.room.broadcast(JSON.stringify({ type: "peer-left" }))
  }
}
