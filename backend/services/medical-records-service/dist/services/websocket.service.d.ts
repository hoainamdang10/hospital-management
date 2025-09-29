import { Server as HttpServer } from 'http';
export declare class WebSocketManager {
    private io;
    private clients;
    private isInitialized;
    /**
     * Initialize WebSocket server
     */
    initialize(httpServer?: HttpServer): Promise<void>;
    /**
     * Setup WebSocket event handlers
     */
    private setupEventHandlers;
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Setup individual socket event handlers
     */
    private setupSocketHandlers;
    /**
     * Handle client authentication
     */
    private handleAuthentication;
    /**
     * Handle joining a room
     */
    private handleJoinRoom;
    /**
     * Handle leaving a room
     */
    private handleLeaveRoom;
    /**
     * Handle medical record subscription
     */
    private handleSubscribeMedicalRecord;
    /**
     * Handle patient subscription
     */
    private handleSubscribePatient;
    /**
     * Handle doctor subscription
     */
    private handleSubscribeDoctor;
    /**
     * Handle client disconnection
     */
    private handleDisconnection;
    /**
     * Broadcast message to all connected clients
     */
    broadcastToAll(event: string, data: any): void;
    /**
     * Broadcast message to specific room
     */
    broadcastToRoom(roomName: string, event: string, data: any): void;
    /**
     * Send message to specific client
     */
    sendToClient(clientId: string, event: string, data: any): void;
    /**
     * Get connected clients count
     */
    getConnectedClientsCount(): number;
    /**
     * Get connection status
     */
    isWebSocketReady(): boolean;
    /**
     * Disconnect and cleanup
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=websocket.service.d.ts.map