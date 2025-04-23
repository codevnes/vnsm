import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { serializeBigInt } from '../utils/jsonUtils';

// Create a separate instance with explicit typing to help TypeScript recognize the model
const prisma = new PrismaClient();

// Get all settings
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    // Use explicit model access
    const settings = await prisma.$queryRaw`SELECT * FROM settings`;
    return res.status(200).json(serializeBigInt(settings));
  } catch (error) {
    console.error('Error getting settings:', error);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Get settings by key
export const getSettingByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    const settings = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key} LIMIT 1`;
    const setting = Array.isArray(settings) && settings.length > 0 ? settings[0] : null;
    
    if (!setting) {
      return res.status(404).json({ error: `Setting with key '${key}' not found` });
    }
    
    return res.status(200).json(serializeBigInt(setting));
  } catch (error) {
    console.error(`Error getting setting by key:`, error);
    return res.status(500).json({ error: 'Failed to get setting' });
  }
};

// Create a new setting
export const createSetting = async (req: Request, res: Response) => {
  try {
    const { key, value, description, type = 'text' } = req.body;
    
    // Validate required fields
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    // Check if setting with the same key already exists
    const existingSettings = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key} LIMIT 1`;
    const existingSetting = Array.isArray(existingSettings) && existingSettings.length > 0;
    
    if (existingSetting) {
      return res.status(400).json({ error: `Setting with key '${key}' already exists` });
    }
    
    // Create new setting with raw SQL
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO settings (\`key\`, value, description, type, created_at, updated_at) 
      VALUES (${key}, ${value}, ${description}, ${type}, ${now}, ${now})
    `;
    
    const newSettings = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key} LIMIT 1`;
    const newSetting = Array.isArray(newSettings) && newSettings.length > 0 ? newSettings[0] : null;
    
    return res.status(201).json(serializeBigInt(newSetting));
  } catch (error) {
    console.error('Error creating setting:', error);
    return res.status(500).json({ error: 'Failed to create setting' });
  }
};

// Update a setting
export const updateSetting = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, description, type } = req.body;
    
    // Check if setting exists
    const existingSettings = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key} LIMIT 1`;
    const existingSetting = Array.isArray(existingSettings) && existingSettings.length > 0 
      ? existingSettings[0] 
      : null;
    
    if (!existingSetting) {
      return res.status(404).json({ error: `Setting with key '${key}' not found` });
    }
    
    // Build update query dynamically based on provided fields
    const now = new Date();
    const updateValue = value !== undefined ? value : existingSetting.value;
    const updateDescription = description !== undefined ? description : existingSetting.description;
    const updateType = type !== undefined ? type : existingSetting.type;
    
    // Update the setting
    await prisma.$executeRaw`
      UPDATE settings 
      SET 
        value = ${updateValue}, 
        description = ${updateDescription}, 
        type = ${updateType},
        updated_at = ${now}
      WHERE \`key\` = ${key}
    `;
    
    const updatedSettings = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key} LIMIT 1`;
    const updatedSetting = Array.isArray(updatedSettings) && updatedSettings.length > 0 
      ? updatedSettings[0] 
      : null;
    
    return res.status(200).json(serializeBigInt(updatedSetting));
  } catch (error) {
    console.error('Error updating setting:', error);
    return res.status(500).json({ error: 'Failed to update setting' });
  }
};

// Delete a setting
export const deleteSetting = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    // Check if setting exists
    const existingSettings = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key} LIMIT 1`;
    const existingSetting = Array.isArray(existingSettings) && existingSettings.length > 0;
    
    if (!existingSetting) {
      return res.status(404).json({ error: `Setting with key '${key}' not found` });
    }
    
    // Delete the setting
    await prisma.$executeRaw`DELETE FROM settings WHERE \`key\` = ${key}`;
    
    return res.status(200).json({ message: `Setting with key '${key}' deleted successfully` });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return res.status(500).json({ error: 'Failed to delete setting' });
  }
};

// Get settings by type
export const getSettingsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    const settings = await prisma.$queryRaw`SELECT * FROM settings WHERE type = ${type}`;
    
    return res.status(200).json(serializeBigInt(settings));
  } catch (error) {
    console.error(`Error getting settings by type:`, error);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
}; 