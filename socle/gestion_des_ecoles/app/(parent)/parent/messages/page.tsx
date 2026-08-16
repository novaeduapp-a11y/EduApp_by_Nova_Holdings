"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  Inbox,
  Clock,
  CheckCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  expediteur: string;
  expediteurRole: string;
  sujet: string;
  contenu: string;
  date: string;
  lu: boolean;
}

export default function MessagesParentPage() {
  const [newMessage, setNewMessage] = useState("");
  const [destinataire, setDestinataire] = useState("");

  // Messages simulés — fonctionnalité en cours de développement
  const messages: Message[] = [
    {
      id: "1",
      expediteur: "Direction",
      expediteurRole: "DIRECTEUR",
      sujet: "Réunion parents-professeurs",
      contenu: "Chers parents, nous vous informons qu&apos;une réunion parents-professeurs aura lieu le samedi 15 février 2026 à 9h00. Votre présence est vivement souhaitée.",
      date: "2026-01-20T10:30:00",
      lu: true,
    },
    {
      id: "2",
      expediteur: "M. Diop - Professeur",
      expediteurRole: "PROFESSEUR",
      sujet: "Comportement en classe",
      contenu: "Bonjour, je souhaite vous informer que votre enfant a fait de grands progrès ce trimestre. Continuez à l&apos;encourager !",
      date: "2026-01-18T14:15:00",
      lu: false,
    },
  ];

  const messagesNonLus = messages.filter(m => !m.lu).length;

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-4 text-sm text-amber-900">
          Cette section affiche des données de démonstration. La messagerie avec l&apos;école sera disponible dans une prochaine version.
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Communiquez avec l&apos;école
          </p>
        </div>
        {messagesNonLus > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {messagesNonLus} non lu(s)
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Nouveau message */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Nouveau message
            </CardTitle>
            <CardDescription>
              Envoyez un message à l&apos;école
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destinataire</label>
              <Select value={destinataire} onValueChange={setDestinataire}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direction">Direction</SelectItem>
                  <SelectItem value="professeur">Professeur principal</SelectItem>
                  <SelectItem value="secretariat">Secrétariat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Écrivez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={5}
              />
            </div>
            <Button className="w-full" disabled={!destinataire || !newMessage}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </CardContent>
        </Card>

        {/* Liste des messages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Boîte de réception
            </CardTitle>
            <CardDescription>
              {messages.length} message(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aucun message</h3>
                <p className="text-muted-foreground mt-1">
                  Vous n&apos;avez pas encore reçu de messages.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                      !message.lu ? "bg-blue-50 border-blue-200" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`text-white text-sm ${
                          message.expediteurRole === "DIRECTEUR" 
                            ? "bg-purple-500" 
                            : "bg-green-500"
                        }`}>
                          {message.expediteur[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{message.expediteur}</span>
                            {!message.lu && (
                              <Badge className="bg-blue-500 text-xs">Nouveau</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(message.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <p className="font-medium text-sm mt-1">{message.sujet}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {message.contenu}
                        </p>
                        {message.lu && (
                          <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                            <CheckCheck className="h-3 w-3" />
                            Lu
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">Communication facilitée</h4>
              <p className="text-sm text-green-700">
                Utilisez cette messagerie pour communiquer avec la direction, les professeurs ou le secrétariat. 
                Les réponses vous seront envoyées dans les plus brefs délais.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
