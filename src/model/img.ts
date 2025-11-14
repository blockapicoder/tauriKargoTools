import { KeysOfType } from "../vue-model";

/** Img — URL typée comme une clé string de T */
export interface ImgNode<
    T extends object,
    NK extends KeysOfType<T, string> = KeysOfType<T, string>
> {
    kind: 'img';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    /** Clé d'un champ string de T contenant l'URL de l'image */
    url: NK;
    alt?: string;
    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;
      useVisibility?: boolean;
}