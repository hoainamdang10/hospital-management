import { Request, Response } from "express";
import { WalletService } from "../../application/services/WalletService";
import { CreateWalletTopUpLinkUseCase } from "../../application/use-cases/CreateWalletTopUpLinkUseCase";
export declare class WalletController {
    private readonly walletService;
    private readonly createWalletTopUpLinkUseCase;
    constructor(walletService: WalletService, createWalletTopUpLinkUseCase: CreateWalletTopUpLinkUseCase);
    getWallet(req: Request, res: Response): Promise<Response>;
    topUp(req: Request, res: Response): Promise<Response>;
    createTopUpLink(req: Request, res: Response): Promise<Response>;
    charge(req: Request, res: Response): Promise<Response>;
    refund(req: Request, res: Response): Promise<Response>;
    private validateAmount;
}
//# sourceMappingURL=WalletController.d.ts.map