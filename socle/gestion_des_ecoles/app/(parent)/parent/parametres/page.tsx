"use client";

import { useState } from "react";
import { 
  Settings, 
  Bell, 
  Mail, 
  Smartphone,
  Moon,
  Sun,
  Globe,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ParametresParentPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    notes: true,
    absences: true,
    bulletins: true,
    messages: true,
  });

  const [langue, setLangue] = useState("fr");
  const [theme, setTheme] = useState("light");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Personnalisez votre expérience
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choisissez comment vous souhaitez être notifié
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Canaux de notification */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Canaux de notification</h4>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">Recevez les alertes par email</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <div>
                    <Label>Notifications par SMS</Label>
                    <p className="text-sm text-muted-foreground">Recevez les alertes par SMS</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                />
              </div>
            </div>

            {/* Types de notifications */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Types de notifications</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Nouvelles notes</Label>
                  <Switch
                    checked={notifications.notes}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, notes: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Absences</Label>
                  <Switch
                    checked={notifications.absences}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, absences: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Bulletins disponibles</Label>
                  <Switch
                    checked={notifications.bulletins}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, bulletins: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Nouveaux messages</Label>
                  <Switch
                    checked={notifications.messages}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, messages: checked })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez l&apos;affichage de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {theme === "light" ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-600" />
                )}
                <div>
                  <Label>Thème</Label>
                  <p className="text-sm text-muted-foreground">Choisissez le thème de l&apos;interface</p>
                </div>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-purple-600" />
                <div>
                  <Label>Langue</Label>
                  <p className="text-sm text-muted-foreground">Langue de l&apos;interface</p>
                </div>
              </div>
              <Select value={langue} onValueChange={setLangue}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Gérez la sécurité de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Changer le mot de passe</p>
                <p className="text-sm text-muted-foreground">
                  Modifiez votre mot de passe de connexion
                </p>
              </div>
              <Button variant="outline" disabled>
                Modifier
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Sessions actives</p>
                <p className="text-sm text-muted-foreground">
                  Gérez vos sessions de connexion
                </p>
              </div>
              <Button variant="outline" disabled>
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bouton sauvegarder */}
        <div className="flex justify-end">
          <Button disabled>
            <Settings className="h-4 w-4 mr-2" />
            Sauvegarder les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}
