import { BackgroundMain, BackgroundOverlay } from "@/components/ui/Background"
import { H1, H2, H3, P } from "@/components/ui/Typography"

export default function TermsConditionsPage() {
    return (
        <BackgroundMain className="min-h-screen flex flex-col">
            <BackgroundOverlay className="flex flex-col py-16 px-6">
                <div className="w-full max-w-5xl">
                    <H1 className="mb-10">Algemene Voorwaarden</H1>

                    <div className="space-y-10">
                        <section>
                            <H2 className="mb-4">1. Algemeen</H2>
                            <P>
                                Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen,
                                bestellingen, overeenkomsten en leveringen van producten via deze webshop.
                            </P>
                            <P className="mt-3">
                                Door een bestelling te plaatsen gaat de klant akkoord met deze algemene voorwaarden.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">2. Producten en maatwerk</H2>
                            <P>
                                De webshop verkoopt zowel standaardproducten als maatwerkproducten.
                            </P>

                            <H3 className="mt-5 mb-2">Onder maatwerkproducten vallen onder andere:</H3>
                            <ul className="list-disc pl-6 space-y-2 text-p">
                                <li>custom builder ontwerpen</li>
                                <li>gepersonaliseerde 3D-prints</li>
                                <li>handmatig geschilderde objecten</li>
                                <li>speciaal op aanvraag gemaakte producten</li>
                            </ul>

                            <P className="mt-4">
                                Maatwerkproducten worden geproduceerd op basis van door de klant gemaakte keuzes en configuraties.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">3. Digitale previews en kleurafwijkingen</H2>
                            <P>
                                De weergegeven afbeeldingen, renders en 3D-previews dienen uitsluitend als digitale indicatie.
                            </P>

                            <P className="mt-3">
                                Werkelijke producten kunnen afwijken van de digitale weergave door onder andere:
                            </P>

                            <ul className="list-disc pl-6 mt-3 space-y-2 text-p">
                                <li>scherminstellingen</li>
                                <li>verlichting</li>
                                <li>materiaalverschillen</li>
                                <li>handmatige afwerking</li>
                                <li>schilderwerk</li>
                                <li>eigenschappen van het 3D-printproces</li>
                            </ul>

                            <P className="mt-4">
                                Kleine verschillen in kleur, textuur, afwerking en positionering worden beschouwd als normale producteigenschappen.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">4. Handmatige afwerking</H2>
                            <P>
                                Sommige producten worden handmatig afgewerkt of geschilderd.
                            </P>

                            <P className="mt-3">
                                Hierdoor is ieder product uniek en kunnen kleine verschillen ontstaan tussen producten onderling of ten opzichte van afbeeldingen en previews.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">5. Gebruik en verantwoordelijkheid</H2>
                            <P>
                                De klant is zelf verantwoordelijk voor correcte plaatsing en veilig gebruik van producten.
                            </P>

                            <P className="mt-3">
                                De verkoper is niet aansprakelijk voor schade ontstaan door verkeerd gebruik,
                                onjuiste montage, onveilige plaatsing of vallen van objecten.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">6. Maatwerk en herroepingsrecht</H2>
                            <P>
                                Maatwerkproducten en gepersonaliseerde producten zijn uitgesloten van het herroepingsrecht conform de geldende Europese consumentenwetgeving.
                            </P>

                            <P className="mt-3">
                                Bestellingen van maatwerkproducten kunnen na productie niet worden geannuleerd of geretourneerd,
                                tenzij sprake is van een productiefout of transportschade.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">7. Levering</H2>
                            <P>
                                Levertijden zijn indicatief en kunnen variëren afhankelijk van drukte,
                                productiecapaciteit, handmatige afwerking en externe vervoerders.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">8. Betaling</H2>
                            <P>
                                Betalingen verlopen via externe betaalproviders.
                            </P>

                            <P className="mt-3">
                                Een bestelling wordt pas definitief verwerkt nadat de betaling succesvol is ontvangen.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">9. Aansprakelijkheid</H2>
                            <P>
                                De aansprakelijkheid van de verkoper is beperkt tot het bedrag van de betreffende bestelling.
                            </P>

                            <P className="mt-3">
                                De verkoper is niet aansprakelijk voor indirecte schade,
                                gevolgschade of schade veroorzaakt door verkeerd gebruik van producten.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">10. Producteigenschappen van 3D-prints</H2>
                            <P>
                                3D-geprinte producten kunnen zichtbare laaglijnen,
                                kleine imperfecties of minimale afwijkingen bevatten.
                            </P>

                            <P className="mt-3">
                                Deze eigenschappen horen bij het productieproces en worden niet beschouwd als defecten.
                            </P>
                        </section>

                        <H2 className="mt-12 mb-4">11. Retourneren & Annuleren</H2>

                        <P className="mb-4">
                            Standaardproducten kunnen binnen 14 dagen na ontvangst worden geretourneerd,
                            mits ongebruikt en in originele staat.
                        </P>

                        <P className="mb-4">
                            Gepersonaliseerde of op maat gemaakte producten, waaronder custom builder
                            ontwerpen, zijn uitgesloten van retournering omdat deze specifiek voor de
                            klant worden geproduceerd.
                        </P>

                        <P className="mb-4">
                            Indien een product beschadigd of incorrect geleverd is, neem dan binnen
                            48 uur contact op via support@jouwdomein.nl met duidelijke foto's van het probleem.
                        </P>

                        <P>
                            Annuleren van een maatwerkbestelling is alleen mogelijk zolang de productie
                            nog niet gestart is.
                        </P>

                        <section>
                            <H2 className="mb-4">12. Privacy</H2>
                            <P>
                                Persoonsgegevens worden verwerkt conform het privacybeleid van de webshop.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">13. Toepasselijk recht</H2>
                            <P>
                                Op alle overeenkomsten is Nederlands recht van toepassing.
                            </P>

                            <P className="mt-3">
                                Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.
                            </P>
                        </section>

                        <section>
                            <H2 className="mb-4">14. Contact</H2>
                            <P>
                                Voor vragen over deze voorwaarden kan contact worden opgenomen via de contactgegevens op de website.
                            </P>
                        </section>
                    </div>
                </div>
            </BackgroundOverlay>
        </BackgroundMain>
    )
}
