CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, cidade, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cidade', ''),
    CASE WHEN NEW.raw_user_meta_data ->> 'tipo' = 'familia' THEN 'familia' ELSE 'cuidadora' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;