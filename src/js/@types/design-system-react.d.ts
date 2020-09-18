/* eslint-disable one-var, import/no-duplicates */

declare module '@salesforce/design-system-react/components/*' {
  import { ComponentType } from 'react';

  const value: ComponentType<any>;
  export default value;
}

declare module '@salesforce/design-system-react/components/utilities/UNSAFE_direction' {
  import { Context } from 'react';

  const UNSAFE_DirectionSettings: Context<string>;
  export default UNSAFE_DirectionSettings;
}

declare module '@salesforce/design-system-react/components/utilities/UNSAFE_direction/private/language-direction' {
  // workaround for babel bug where it doesn't like the duplicated import
  import { ComponentClass, ComponentType as ComponentType2 } from 'react';

  const withLanguageDirection: (
    component: ComponentType2<any>,
  ) => ComponentClass<any>;
  export default withLanguageDirection;
}

declare module '@salesforce/design-system-react/components/settings' {
  const settings: {
    setAssetsPaths: (path: string) => void;
    getAssetsPaths: () => string;
    setAppElement: (el: Element) => void;
    getAppElement: () => Element | undefined;
  };
  export default settings;
}

declare module '@salesforce/design-system-react/components/combobox/filter' {
  type Option = {
    id: string;
    icon?: JSX.Element;
    label?: string;
    subTitle?: string;
    type?: string;
    disabled?: boolean;
    tooltipContent?: JSX.Element;
  };
  type Selection = {
    id: string;
    icon?: JSX.Element;
    label?: string;
    subTitle?: string;
    type?: string;
  };

  const filter: (opts: {
    inputValue: string;
    limit?: number;
    options: Option[];
    selection: Selection[];
  }) => Option[];

  export default filter;
}
