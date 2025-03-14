// src/cart/controllers/cart.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from '../services/cart.service';
import { UserService } from '../../user/services/user.service';
import { Types } from 'mongoose';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { NotFoundException } from '@nestjs/common';

describe('CartController', () => {
  let cartController: CartController;
  let cartService: CartService;
  let userService: UserService;

  const mockUser = {
    _id: new Types.ObjectId(),
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  const mockProductId = new Types.ObjectId();

  const mockCart = {
    _id: new Types.ObjectId(),
    user: mockUser._id,
    products: [{ product: mockProductId, quantity: 2 }],
    checkedOut: false,
  };

  const mockCartService = {
    addProductToCart: jest.fn().mockResolvedValue(mockCart),
    getCartForUser: jest.fn().mockResolvedValue(mockCart),
    removeProductFromCart: jest.fn().mockResolvedValue({
      ...mockCart,
      products: [], // Panier sans produit après suppression
    }),
  };

  const mockUserService = {
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      // Mock du AuthGuard pour éviter l'erreur liée au JwtService
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true), // Le guard renvoie toujours `true`
      })
      .compile();

    cartController = module.get<CartController>(CartController);
    cartService = module.get<CartService>(CartService);
    userService = module.get<UserService>(UserService);
  });

  describe('addProductToCart', () => {
    it('devrait ajouter un produit au panier avec succès', async () => {
      const productId = new Types.ObjectId().toString();
      const userId = mockUser._id.toString();
      const quantity = 2;

      // Exécute l'ajout du produit au panier
      const result = await cartController.addProductToCart(
        productId,
        userId,
        quantity,
      );

      // Vérifie que `cartService.addProductToCart` est bien appelé avec les bons paramètres
      expect(cartService.addProductToCart).toHaveBeenCalledWith(
        userId,
        productId,
        quantity,
      );

      // Vérifie que le résultat est correct
      expect(result).toEqual(mockCart);
    });
  });

  describe('getCart', () => {
    it('devrait retourner le panier pour un utilisateur donné', async () => {
      const userId = mockUser._id.toString();

      const result = await cartController.getCart(userId);

      expect(cartService.getCartForUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockCart);
    });

    it('devrait lever une erreur si le panier est introuvable', async () => {
      mockCartService.getCartForUser.mockRejectedValueOnce(
        new NotFoundException('Panier non trouvé'),
      );

      await expect(
        cartController.getCart(mockUser._id.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeProductFromCart', () => {
    it('devrait supprimer un produit du panier avec succès', async () => {
      const productId = mockProductId.toString();
      const userId = mockUser._id.toString();

      const result = await cartController.removeProductFromCart(
        productId,
        userId,
      );

      expect(cartService.removeProductFromCart).toHaveBeenCalledWith(
        userId,
        productId,
      );
      expect(result.products).toHaveLength(0); // Vérifie que le produit a été supprimé
    });
  });
});
