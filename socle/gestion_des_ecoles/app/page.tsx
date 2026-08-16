import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  Smartphone,
  Wallet,
  AlertTriangle,
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Play,
  Zap,
  Globe,
  Clock,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  EduGestion Pro
                </span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2">Sénégal 🇸🇳</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#fonctionnalites" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Fonctionnalités
              </a>
              <a href="#tarifs" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Tarifs
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  Se connecter
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                  Démarrer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-white" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100 px-4 py-2 text-sm font-medium">
              <Zap className="h-4 w-4 mr-2" />
              Nouveau : Espace Parent & Détection élèves en difficulté
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight">
              La gestion scolaire
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                simplifiée & intelligente
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Plateforme complète pour les écoles primaires au Sénégal. 
              Gérez élèves, notes, bulletins et paiements. 
              <strong className="text-gray-900">Optimisée pour les connexions faibles.</strong>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/30 text-lg px-8 py-6">
                  Essai gratuit 1 trimestre
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2">
                <Play className="h-5 w-5 mr-2" />
                Voir la démo
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Installation gratuite</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Support WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Données sécurisées</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { value: "500+", label: "Élèves gérés", icon: Users },
              { value: "15+", label: "Écoles partenaires", icon: GraduationCap },
              { value: "10K+", label: "Bulletins générés", icon: FileText },
              { value: "99%", label: "Satisfaction", icon: Star },
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <div className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700">Fonctionnalités</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Tout ce dont votre école a besoin
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Une solution complète conçue spécifiquement pour les écoles sénégalaises
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Users,
                title: "Gestion des Élèves",
                description: "Inscriptions, fiches détaillées, import/export Excel, photos et suivi complet du parcours scolaire.",
                color: "blue",
                features: ["Import CSV/Excel", "Matricules auto", "Fiches photos"],
              },
              {
                icon: BookOpen,
                title: "Notes & Moyennes",
                description: "Saisie intuitive des notes, calcul automatique des moyennes et classements par classe.",
                color: "green",
                features: ["Saisie rapide", "Moyennes auto", "Classements"],
              },
              {
                icon: FileText,
                title: "Bulletins PDF",
                description: "Génération de bulletins professionnels avec QR Code de vérification anti-fraude.",
                color: "purple",
                features: ["QR Code sécurisé", "Génération en lot", "Mentions auto"],
              },
              {
                icon: Smartphone,
                title: "Espace Parent",
                description: "Les parents consultent notes, absences et téléchargent les bulletins depuis leur téléphone.",
                color: "orange",
                badge: "Nouveau",
                features: ["Accès mobile", "Temps réel", "Bulletins PDF"],
              },
              {
                icon: AlertTriangle,
                title: "Détection Difficultés",
                description: "Identification automatique des élèves en difficulté (moyenne < 10) avec alertes visuelles.",
                color: "red",
                badge: "Nouveau",
                features: ["Alertes auto", "Stats par classe", "Suivi personnalisé"],
              },
              {
                icon: Wallet,
                title: "Paiements Scolaires",
                description: "Suivi des frais de scolarité avec paiements Wave et Orange Money intégrés.",
                color: "cyan",
                badge: "Nouveau",
                features: ["Wave / OM", "Paiements partiels", "Reçus auto"],
              },
              {
                icon: BarChart3,
                title: "Statistiques Avancées",
                description: "Tableaux de bord avec taux de réussite, graphiques et indicateurs de performance.",
                color: "indigo",
                features: ["Taux réussite", "Graphiques", "Export rapports"],
              },
              {
                icon: Shield,
                title: "Sécurité Maximale",
                description: "Données chiffrées, authentification sécurisée et journalisation de toutes les actions.",
                color: "gray",
                features: ["Chiffrement", "Logs activité", "Sauvegardes"],
              },
              {
                icon: Globe,
                title: "Connexion Faible",
                description: "Interface optimisée pour fonctionner même avec une connexion internet limitée.",
                color: "teal",
                features: ["Chargement rapide", "Mode hors-ligne", "Données légères"],
              },
            ].map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${feature.color}-500 to-${feature.color}-600`} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-${feature.color}-100`}>
                      <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
                    </div>
                    {feature.badge && (
                      <Badge className="bg-green-100 text-green-700 text-xs">{feature.badge}</Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.features.map((f, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <Badge className="mb-4 bg-green-100 text-green-700">Pourquoi nous choisir</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Conçu pour les écoles sénégalaises
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Nous comprenons les défis uniques des établissements scolaires au Sénégal. 
                Notre plateforme est adaptée à vos besoins réels.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Clock,
                    title: "Gain de temps considérable",
                    description: "Automatisez les tâches répétitives : calculs de moyennes, génération de bulletins, classements...",
                  },
                  {
                    icon: Smartphone,
                    title: "Accessible partout",
                    description: "Fonctionne sur ordinateur, tablette et téléphone. Même avec une connexion 3G.",
                  },
                  {
                    icon: Users,
                    title: "Support local dédié",
                    description: "Équipe basée au Sénégal, support WhatsApp en français et wolof.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl h-fit">
                      <item.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Ce que disent nos utilisateurs</h3>
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white/90 italic mb-3">
                      &quot;Avant, je passais des heures à calculer les moyennes. Maintenant, tout est automatique. Un vrai gain de temps !&quot;
                    </p>
                    <p className="text-sm text-white/70">— Mme Diallo, Directrice à Dakar</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white/90 italic mb-3">
                      &quot;Les parents adorent pouvoir suivre les notes de leurs enfants sur leur téléphone.&quot;
                    </p>
                    <p className="text-sm text-white/70">— M. Ndiaye, Directeur à Thiès</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700">Tarifs</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Des prix adaptés à chaque école
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Essai gratuit pendant 1 trimestre. Sans engagement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Essentiel",
                price: "50 000",
                period: "FCFA/an",
                description: "Pour les petites écoles",
                features: [
                  "Jusqu&apos;à 100 élèves",
                  "Gestion des notes",
                  "Bulletins PDF",
                  "1 utilisateur admin",
                  "Support email",
                ],
                popular: false,
              },
              {
                name: "Standard",
                price: "100 000",
                period: "FCFA/an",
                description: "Le plus populaire",
                features: [
                  "Jusqu&apos;à 300 élèves",
                  "Toutes les fonctionnalités",
                  "Espace Parent",
                  "5 utilisateurs",
                  "Support WhatsApp prioritaire",
                  "Statistiques avancées",
                ],
                popular: true,
              },
              {
                name: "Premium",
                price: "200 000",
                period: "FCFA/an",
                description: "Pour les grands établissements",
                features: [
                  "Élèves illimités",
                  "Toutes les fonctionnalités",
                  "Multi-établissements",
                  "Utilisateurs illimités",
                  "Support téléphone dédié",
                  "Formation sur site",
                  "Personnalisation logo",
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <Card key={index} className={`relative overflow-hidden ${plan.popular ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Populaire
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-2">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: feature }} />
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
                      Commencer l&apos;essai gratuit
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à moderniser votre école ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez les écoles qui ont déjà fait le choix de la simplicité et de l&apos;efficacité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                Démarrer gratuitement
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
              <Phone className="h-5 w-5 mr-2" />
              Nous appeler
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700">Contact</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Parlons de votre projet
              </h2>
              <p className="text-gray-600 mb-8">
                Notre équipe est disponible pour répondre à vos questions et vous accompagner dans la mise en place de la plateforme.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Téléphone / WhatsApp</p>
                    <p className="text-gray-600">+221 77 454 86 61</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">el.elhadji.dieng@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Adresse</p>
                    <p className="text-gray-600">Dakar, Parcelle Assainie U8, Sénégal</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Demander une démo</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;école</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: École Primaire Cheikh Anta Diop" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Mamadou Diallo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: 77 123 45 67" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d&apos;élèves</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Moins de 100</option>
                    <option>100 - 300</option>
                    <option>300 - 500</option>
                    <option>Plus de 500</option>
                  </select>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg">
                  Demander une démo gratuite
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-xl">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xl font-bold">EduGestion Pro</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                La plateforme de gestion scolaire la plus complète pour les écoles primaires au Sénégal. Simplifiez votre quotidien.
              </p>
              <div className="flex gap-4">
                <Badge className="bg-green-600">🇸🇳 Made in Senegal</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Conditions d&apos;utilisation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} EduGestion Pro. Tous droits réservés.
            </p>
            <p className="text-gray-400 text-sm">
              Développé avec ❤️ par El Hadji Dieng
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
