import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '../types/user.type';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private jwtService: JwtService, // Service pour gérer les tokens JWT
  ) {}

  async create(userData: UserType): Promise<{ user: User; token: string }> {
    const { email, password, ...rest } = userData;
    // Vérifier si un utilisateur avec cet email existe déjà
    const existingUser = await this.findOneByEmail(email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà.');
    }

    // Hacher le mot de passe avant de sauvegarder
    const saltRounds = 10; // Définir le nombre de rounds pour bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer et sauvegarder le nouvel utilisateur avec le mot de passe haché
    const user = new this.userModel({
      ...rest,
      email: email,
      password: hashedPassword,
    });
    console.log(user);
    const savedUser = await user.save();

    // Générer un token JWT
    const payload = { userId: savedUser._id, email: savedUser.email };
    const token = this.jwtService.sign(payload);

    // Retourner l'utilisateur et le token
    return { user: savedUser, token };
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  // Méthode pour compter les utilisateurs
  async countUsers(): Promise<number> {
    try {
      return await this.userModel.countDocuments().exec(); // Compter tous les documents utilisateurs
    } catch (error) {
      throw new Error(
        'Erreur lors du comptage des utilisateurs: ' + error.message,
      );
    }
  }

  // Trouver un utilisateur par email
  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }
}
