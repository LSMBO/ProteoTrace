from Bio import SeqIO
from ProteinGroup import ProteinGroup
from Protein import Protein
from Peptide import Peptide

class Maxquant:
    def __init__(self, result_folder, fasta_file):
        self.result_folder = result_folder
        self.file_proteins = self.get_table_from_file("proteinGroups.txt")
        self.file_peptides = self.get_table_from_file("modificationSpecificPeptides.txt")
        self.file_proteins_col_names = self.file_proteins[0]
        self.file_proteins = self.file_proteins[1:]
        self.file_peptides_col_names = self.file_peptides[0]
        self.file_peptides = self.file_peptides[1:]
        self.sequences = self.read_fasta(fasta_file)
        self.peptides = self.search_peptides()
        self.proteins, self.protein_groups = self.search_proteins()

    def get_table_from_file(self, file):
        table_data = []
        file_path = f"{self.result_folder}/{file}"
        with open(file_path, 'r', encoding='utf-8-sig') as txt_file:
            for line in txt_file:
                line = line.lstrip('\ufeff')
                row_values = [value.strip() for value in line.strip().split('\t')]
                table_data.append(row_values)
        return table_data

    def worksheet_to_table(self, worksheet):
        table = []
        for row in worksheet.iter_rows(values_only=True):
            table.append(list(row))
        return table
    
    def read_fasta(self, fasta_file):
        sequences = []
        for record in SeqIO.parse(fasta_file, "fasta"):
            if not record.id.startswith("#"):
                entry = {}
                entry["id"] = record.id
                entry["description"] = record.description
                entry["sequence"] = str(record.seq)
                sequences.append(entry)
        return sequences
    
    def search_peptides(self):
        peptides = []
        peptide_id_step = 0
        peptide_sequences = []
        for row in self.file_peptides:
            peptide_id = int(row[self.file_peptides_col_names.index('id')])
            peptide_sequence = row[self.file_peptides_col_names.index('Sequence')]
            if peptide_sequence in peptide_sequences:
                peptide_id_step = peptide_id_step + 1
            else:
                peptide_sequences.append(peptide_sequence)
                peptide_id = peptide_id - peptide_id_step
                peptides.append(Peptide(self.sequences, str(peptide_id), str(peptide_id - peptide_id_step), self.file_peptides_col_names, row))
        return peptides
        
    def search_proteins(self):
        protein_rows = {}
        protein_group_rows = {}
        protein_group_names_column = self.file_proteins_col_names.index("Protein IDs")
        protein_group_id_column = self.file_proteins_col_names.index("id")
        for row in self.file_proteins:
            protein_group_id = row[protein_group_id_column]
            protein_ids = row[protein_group_names_column].split(';')

            for protein_id in protein_ids:
                if protein_id in protein_rows:
                    protein_rows[protein_id].append(row)
                else:
                    protein_rows[protein_id] = [row]

            if protein_group_id in protein_group_rows:
                protein_group_rows[protein_group_id].append(row)
            else:
                protein_group_rows[protein_group_id] = [row]
                
        proteins = []
        protein_groups = []
        for protein_id, protein_rows_list in protein_rows.items():
            proteins.append(Protein(self.sequences, protein_id, self.file_proteins_col_names, protein_rows_list, self.peptides))
        
        for protein_group_id, protein_gruop_rows_list in protein_group_rows.items():
            protein_groups.append(ProteinGroup(self.sequences, protein_group_id, self.file_proteins_col_names, protein_gruop_rows_list, self.peptides))
        
        return proteins, protein_groups